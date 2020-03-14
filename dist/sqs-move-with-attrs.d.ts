import { SQS } from "aws-sdk";
export declare class SqsMoveWithAttrs {
    private readonly sqsClient;
    private readonly fromSqsUrl;
    private readonly toSqsUrl;
    private processedMessagesCount;
    private receiveOptions;
    private receiveMessageRequestCount;
    constructor(sqsClient: SQS, fromSqsUrl: string, toSqsUrl: string);
    private reportProgress;
    private castMessageAttributes;
    /**
     * @return promise resolved with number of moved messages
     */
    private moveJob;
    /**
     * Do moving messages from source to destination queue
     * @param jobConcurrency
     * @return promise resolved with number of moved messages
     */
    move(jobConcurrency?: number): Promise<number>;
}
