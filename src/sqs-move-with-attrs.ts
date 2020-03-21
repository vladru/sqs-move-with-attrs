'use strict';

import {SQS} from "aws-sdk";

// https://docs.aws.amazon.com/AWSSimpleQueueService/latest/APIReference/API_SendMessageBatch.html
const MAX_SEND_MESSAGE_PAYLOAD_SIZE_BYTES =256*1024;

export class SqsMoveWithAttrs {

    private readonly sqsClient: SQS;
    private readonly fromSqsUrl: string;
    private readonly toSqsUrl: string;

    private receivedMessagesCount: number;
    private movedMessagesCount: number;
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

        this.receivedMessagesCount = 0;
        this.movedMessagesCount = 0;
    }

    private reportProgress(receivedMessages: number, movedMessages: number): void {
        this.receivedMessagesCount += receivedMessages;
        this.movedMessagesCount += movedMessages;
        process.stdout.write("\rMessages received "+this.receivedMessagesCount+", moved "+this.movedMessagesCount);
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

        const deleteRequest: SQS.DeleteMessageBatchRequest = {
            QueueUrl: this.fromSqsUrl,
            Entries: []
        };

        let movedMessagesCount = 0;

        do {

            const receiveBatchResponse: SQS.ReceiveMessageResult = await this.sqsClient.receiveMessage(this.receiveOptions).promise();
            if (!receiveBatchResponse.Messages) {
                return movedMessagesCount
            }

            let id = 0;
            const sendRequests: SQS.SendMessageBatchRequest[] = [];
            let sendRequest = this.createSendMessageBatchRequest();
            let sendRequestPayloadSize = 0;
            deleteRequest.Entries = [];
            for (const message of receiveBatchResponse.Messages) {
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
            const failedIds: string[] = [];
            for (const request of sendRequests) {
                const sendBatchResponse = await this.sqsClient.sendMessageBatch(request).promise();
                sendBatchResponse.Failed.forEach( (entry) => {
                    console.error(" Send message failure: %s, error code %s", entry.Message, entry.Code);
                    failedIds.push(entry.Id)
                })
            }
            // delete failed IDs from deleteRequest.Entries
            failedIds.forEach( failedId => {
                const deleteEntryIndex = deleteRequest.Entries.findIndex( it => it.Id === failedId);
                if (deleteEntryIndex > -1) {
                    deleteRequest.Entries.splice(deleteEntryIndex,1)
                }
            });

            await this.sqsClient.deleteMessageBatch(deleteRequest).promise();

            movedMessagesCount += deleteRequest.Entries.length;
            this.reportProgress(receiveBatchResponse.Messages.length, movedMessagesCount);

            // eslint-disable-next-line no-constant-condition
        } while (true);

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
