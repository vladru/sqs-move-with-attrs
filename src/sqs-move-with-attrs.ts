import {SQS} from "aws-sdk";

// https://docs.aws.amazon.com/AWSSimpleQueueService/latest/APIReference/API_SendMessageBatch.html
const MAX_SEND_MESSAGE_PAYLOAD_SIZE_BYTES =256*1024;

export class SqsMoveWithAttrs {

    private readonly sqsClient: SQS;
    private readonly fromSqsUrl: string;
    private readonly toSqsUrl: string;

    private processedMessagesCount: number;
    private receiveOptions: SQS.ReceiveMessageRequest;
    private receiveMessageRequestCount: number;

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
        this.receiveMessageRequestCount = 0;
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

    private createSendMessageBatchRequest = (): SQS.SendMessageBatchRequest => {
      return {
          QueueUrl: this.toSqsUrl,
          Entries: []
      }
    };

    private getSendEntrySizeInBytes = (entry: SQS.SendMessageBatchRequestEntry): number => {
        const str = JSON.stringify(entry);
        return Buffer.byteLength(str, "utf-8")
    };

    /**
     * @return promise resolved with number of moved messages
     */
    private async moveJob(): Promise<number> {

        // eslint-disable-next-line no-async-promise-executor
        return new Promise( async (resolve, reject) => {

            const deleteRequest: SQS.DeleteMessageBatchRequest = {
                QueueUrl: this.fromSqsUrl,
                Entries: []
            };

            let movedMessagesCount = 0;

            try {

                do {
                    // for Debugging
                    // if (++this.receiveMessageRequestCount > 100) {
                    //     resolve(movedMessagesCount);
                    //     return
                    // }

                    const response: SQS.ReceiveMessageResult = await this.sqsClient.receiveMessage(this.receiveOptions).promise();
                    if (!response.Messages) {
                        resolve(movedMessagesCount);
                        return
                    }

                    let id = 0;
                    const sendRequests: SQS.SendMessageBatchRequest[] = [];
                    let sendRequest = this.createSendMessageBatchRequest();
                    let sendRequestPayloadSize = 0;
                    deleteRequest.Entries = [];
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
                            const sendEntrySize = this.getSendEntrySizeInBytes(sendEntry);
                            if (sendRequestPayloadSize + sendEntrySize > MAX_SEND_MESSAGE_PAYLOAD_SIZE_BYTES) {
                                sendRequests.push(sendRequest);
                                sendRequest = this.createSendMessageBatchRequest();
                                sendRequestPayloadSize = 0;
                            }
                            sendRequestPayloadSize += sendEntrySize;
                            sendRequest.Entries.push(sendEntry);
                            deleteRequest.Entries.push({
                                Id: ''+id,
                                ReceiptHandle: message.ReceiptHandle
                            })
                        }
                    }

                    sendRequests.push(sendRequest);
                    for (const request of sendRequests) {
                        await this.sqsClient.sendMessageBatch(request).promise();
                    }
                    await this.sqsClient.deleteMessageBatch(deleteRequest).promise();
                    movedMessagesCount += response.Messages.length;

                    this.reportProgress(response.Messages.length);

                    // eslint-disable-next-line no-constant-condition
                } while (true);

            } catch (err) {
                reject(err)
            }

        });

    }

    /**
     * Do moving messages from source to destination queue
     * @param jobConcurrency
     * @return promise resolved with number of moved messages
     */
    public async move(jobConcurrency= 50): Promise<number> {
        const moveJobs: Promise<number>[] = [];
        for (let i=0; i < jobConcurrency; i++) {
            moveJobs.push(this.moveJob());
        }
        const result = await Promise.all(moveJobs);
        return result.reduce( (prevValue, currentValue) => { return prevValue + currentValue}, 0)
    }
}
