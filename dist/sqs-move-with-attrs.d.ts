/// <reference types="node" />
import { SQS } from "aws-sdk";
import { EventEmitter } from "events";
export declare interface SqsMoveWithAttrs {
    on(event: 'progress', listener: (receivedMessages: number, movedMessages: number) => void): this;
    on(event: string, listener: Function): this;
}
export declare class SqsMoveWithAttrs extends EventEmitter {
    private readonly sqsClient;
    private readonly fromSqsUrl;
    private readonly toSqsUrl;
    private receiveOptions;
    constructor(sqsClient: SQS, fromSqsUrl: string, toSqsUrl: string);
    private reportProgress;
    private castMessageAttributes;
    private createSendMessageBatchRequest;
    private getSendEntrySizeInBytes;
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
