import {SQS} from "aws-sdk";

export class SqsMoveWithAttrs {

    private readonly sqsClient: SQS;
    private readonly fromSqsUrl: string;
    private readonly toSqsUrl: string;

    private processedMessagesCount: number;
    private jobLaunchingCount: number;
    private receiveOptions: SQS.ReceiveMessageRequest;

    constructor(sqsClient: SQS, fromSqsUrl: string, toSqsUrl: string) {
        this.sqsClient = sqsClient;
        this.fromSqsUrl = fromSqsUrl;
        this.toSqsUrl = toSqsUrl;

        this.receiveOptions = {
            MessageAttributeNames: [
                "All"
            ],
            QueueUrl: fromSqsUrl,
            MaxNumberOfMessages: 10,
            VisibilityTimeout: 30,
            WaitTimeSeconds: 0
        };

        this.processedMessagesCount = 0;
        this.jobLaunchingCount = 0;
    }

    private reportProgress(numMessages: number): void {
        this.processedMessagesCount += numMessages;
        process.stdout.write("\rMessages moved:"+this.processedMessagesCount);
    }

    private castMessageAttributes = (source: SQS.MessageBodyAttributeMap): SQS.MessageBodyAttributeMap => {
        for ( const key in source) {
            // noinspection JSUnfilteredForInLoop
            delete source[key].StringListValues;
            // noinspection JSUnfilteredForInLoop
            delete source[key].BinaryListValues;
        }
        return source;
    };

    private async moveJob(jobNum: number): Promise<void> {
        // for Debugging
        // if (++this.jobLaunchingCount > 100) {
        //     return
        // }

        let response: SQS.ReceiveMessageResult | null = await this.sqsClient.receiveMessage(this.receiveOptions).promise();
        if (!response.Messages) {
            return
        }

        let sendRequest: SQS.SendMessageBatchRequest | null = {
            QueueUrl: this.toSqsUrl,
            Entries: []
        };
        let deleteRequest: SQS.DeleteMessageBatchRequest | null = {
            QueueUrl: this.fromSqsUrl,
            Entries: []
        };

        let id = 0;
        for (const message of response.Messages) {
            if (message.Body && message.ReceiptHandle) {
                id++;
                const sendEntry: SQS.SendMessageBatchRequestEntry = {
                    Id: ''+id,
                    MessageBody: message.Body
                };
                if (message.MessageAttributes) {
                    sendEntry.MessageAttributes = this.castMessageAttributes(message.MessageAttributes)
                }
                sendRequest.Entries.push(sendEntry);
                deleteRequest.Entries.push({
                    Id: ''+id,
                    ReceiptHandle: message.ReceiptHandle
                })
            }
        }

        await this.sqsClient.sendMessageBatch(sendRequest).promise();
        await this.sqsClient.deleteMessageBatch(deleteRequest).promise();

        this.reportProgress(response.Messages.length);

        // release memory before recursive call
        sendRequest = null;
        deleteRequest = null;
        response = null;

        return this.moveJob(jobNum);
    }

    public async move(jobConcurrency= 50): Promise<void[]> {
        const moveJobs: Promise<void>[] = [];
        for (let i=0; i < jobConcurrency; i++) {
            moveJobs.push(this.moveJob(i+1));
        }
        return Promise.all(moveJobs)
    }
}
