'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
// https://docs.aws.amazon.com/AWSSimpleQueueService/latest/APIReference/API_SendMessageBatch.html
const MAX_SEND_MESSAGE_PAYLOAD_SIZE_BYTES = 256 * 1024;
class SqsMoveWithAttrs extends events_1.EventEmitter {
    constructor(sqsClient, fromSqsUrl, toSqsUrl) {
        super();
        this.castMessageAttributes = (source) => {
            for (const key in source) {
                // noinspection JSUnfilteredForInLoop
                delete source[key].StringListValues;
                // noinspection JSUnfilteredForInLoop
                delete source[key].BinaryListValues;
            }
            return source;
        };
        this.createSendMessageBatchRequest = () => {
            return {
                QueueUrl: this.toSqsUrl,
                Entries: []
            };
        };
        this.getSendEntrySizeInBytes = (entry) => {
            const str = JSON.stringify(entry);
            return Buffer.byteLength(str, "utf-8");
        };
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
    }
    reportProgress(receivedMessages, movedMessages) {
        this.emit("progress", receivedMessages, movedMessages);
    }
    /**
     * @return promise resolved with number of moved messages
     */
    async moveJob() {
        const deleteRequest = {
            QueueUrl: this.fromSqsUrl,
            Entries: []
        };
        let movedMessagesCount = 0;
        do {
            const receiveBatchResponse = await this.sqsClient.receiveMessage(this.receiveOptions).promise();
            if (!receiveBatchResponse.Messages) {
                return movedMessagesCount;
            }
            let id = 0;
            const sendRequests = [];
            let sendRequest = this.createSendMessageBatchRequest();
            let sendRequestPayloadSize = 0;
            deleteRequest.Entries = [];
            for (const message of receiveBatchResponse.Messages) {
                if (message.Body && message.ReceiptHandle) {
                    id++;
                    const sendEntry = {
                        Id: '' + id,
                        MessageBody: message.Body
                    };
                    if (message.MessageAttributes) {
                        sendEntry.MessageAttributes = this.castMessageAttributes(message.MessageAttributes);
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
                        Id: '' + id,
                        ReceiptHandle: message.ReceiptHandle
                    });
                }
            }
            sendRequests.push(sendRequest);
            const failedIds = [];
            for (const request of sendRequests) {
                const sendBatchResponse = await this.sqsClient.sendMessageBatch(request).promise();
                sendBatchResponse.Failed.forEach((entry) => {
                    console.error(" Send message failure: %s, error code %s", entry.Message, entry.Code);
                    failedIds.push(entry.Id);
                });
            }
            // delete failed IDs from deleteRequest.Entries
            failedIds.forEach(failedId => {
                const deleteEntryIndex = deleteRequest.Entries.findIndex(it => it.Id === failedId);
                if (deleteEntryIndex > -1) {
                    deleteRequest.Entries.splice(deleteEntryIndex, 1);
                }
            });
            await this.sqsClient.deleteMessageBatch(deleteRequest).promise();
            movedMessagesCount += deleteRequest.Entries.length;
            this.reportProgress(receiveBatchResponse.Messages.length, deleteRequest.Entries.length);
            // eslint-disable-next-line no-constant-condition
        } while (true);
    }
    /**
     * Do moving messages from source to destination queue
     * @param jobConcurrency
     * @return promise resolved with number of moved messages
     */
    async move(jobConcurrency = 50) {
        const moveJobs = [];
        for (let i = 0; i < jobConcurrency; i++) {
            moveJobs.push(this.moveJob());
        }
        const result = await Promise.all(moveJobs);
        return result.reduce((prevValue, currentValue) => { return prevValue + currentValue; }, 0);
    }
}
exports.SqsMoveWithAttrs = SqsMoveWithAttrs;
//# sourceMappingURL=sqs-move-with-attrs.js.map