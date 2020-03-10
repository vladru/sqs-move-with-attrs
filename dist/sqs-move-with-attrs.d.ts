import { SQS } from "aws-sdk";
export declare class SqsMoveWithAttrs {
    private readonly sqsClient;
    private readonly fromSqsUrl;
    private readonly toSqsUrl;
    private processedMessagesCount;
    private jobLaunchingCount;
    private receiveOptions;
    constructor(sqsClient: SQS, fromSqsUrl: string, toSqsUrl: string);
    private reportProgress;
    private castMessageAttributes;
    private moveJob;
    move(jobConcurrency?: number): Promise<void[]>;
}
