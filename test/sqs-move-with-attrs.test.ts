import AwsSdkMock from 'aws-sdk-mock';
import AwsSdk from "aws-sdk"
AwsSdkMock.setSDKInstance(AwsSdk);

import {assert, expect} from "chai";

import sinon from 'ts-sinon';

import {SQS} from "aws-sdk";
import {SqsMoveWithAttrs} from "../src/sqs-move-with-attrs";

describe("test move method", () => {

    const createMessage = (): SQS.Message => {
        return  {
            Body: "test",
                MessageAttributes: {
            "Attribute": {
                "DataType": "String",
                    "StringValue": "Attribute Value",
                    "StringListValues": [],
                    "BinaryListValues": []
            }
        },
            ReceiptHandle: ""+new Date().getTime()
        }
    };

    const createBigMessage = (): SQS.Message => {
        const message = createMessage();
        message.Body = "Long string".repeat(256*1024/8).substr(0, 254*1024);
        return message
    };

    let receiveMessageResponses: SQS.ReceiveMessageResult[];
    const getReceiveMessageResponse = (callNum: number): SQS.ReceiveMessageResult  => {
        if (callNum > receiveMessageResponses.length) {
            return {}
        }
        return receiveMessageResponses[callNum-1]
    };
    const receiveMessageSpy = sinon.spy((params: SQS.ReceiveMessageRequest, callback: Function): void =>
    {
        callback(null, getReceiveMessageResponse(receiveMessageSpy.callCount))
    });

    let sendMessagesCount: number;
    const sendMessageBatchSpy = sinon.spy((params: SQS.SendMessageBatchRequest, callback: Function): void =>
    {
        sendMessagesCount += params.Entries.length;
        const response: SQS.SendMessageBatchResult = {
            Successful: [],
            Failed: []
        };
        callback(null, response)
    });

    let deletedMessagesCount: number;
    const deleteMessageBatchSpy = sinon.spy((params: SQS.DeleteMessageBatchRequest, callback: Function): void =>
    {
        deletedMessagesCount += params.Entries.length;
        const response: SQS.DeleteMessageBatchResult = {
            Successful: [],
            Failed: []
        };
        callback(null, response)
    });

    let sqsClient: SQS;

    before( () => {
        AwsSdkMock.mock("SQS", "receiveMessage", receiveMessageSpy);
        AwsSdkMock.mock("SQS", "sendMessageBatch", sendMessageBatchSpy);
        AwsSdkMock.mock("SQS", "deleteMessageBatch", deleteMessageBatchSpy);

        sqsClient = new SQS({region: "us-east-1"});
    });

    after( () => {
       AwsSdkMock.restore()
    });

    beforeEach( () => {
        receiveMessageSpy.resetHistory();
        sendMessageBatchSpy.resetHistory();
        deleteMessageBatchSpy.resetHistory();
        sendMessagesCount = 0;
        deletedMessagesCount = 0;
    });

    it ("should nothing to do if source SQS is empty", async () => {
        receiveMessageResponses = [];
        const sqsMove= new SqsMoveWithAttrs(sqsClient, "from", "to");
        expect(await sqsMove.move(5)).to.equals(0);
        expect(receiveMessageSpy.callCount).to.equal(5);
        assert(sendMessageBatchSpy.notCalled);
    });

    it ("should move 1 message from source to destination", async () => {
        receiveMessageResponses = [
            {
                Messages: [
                    createMessage()
                ]
            }];

        const sqsMove= new SqsMoveWithAttrs(sqsClient, "from", "to");
        expect (await sqsMove.move(4)).to.equals(1);

        expect(receiveMessageSpy.callCount).to.equal(5);
        const receiveMessageRequest = receiveMessageSpy.args[0][0];
        expect(receiveMessageRequest).to.deep.equals({
            QueueUrl: "from",
            MessageAttributeNames: ["All"],
            MaxNumberOfMessages: 10,
            VisibilityTimeout: 30,
            WaitTimeSeconds: 0
        } as SQS.ReceiveMessageRequest);

        assert(sendMessageBatchSpy.calledOnce);
        const sendMessageBatchRequest = sendMessageBatchSpy.args[0][0];
        expect(sendMessageBatchRequest).to.deep.equals({
            QueueUrl: "to",
            Entries: [
                {
                    Id: "1",
                    MessageBody: "test",
                    MessageAttributes: {
                        "Attribute": {
                            "DataType": "String",
                            "StringValue": "Attribute Value"
                        }
                    }
                }
            ]
        } as SQS.SendMessageBatchRequest);

        assert(deleteMessageBatchSpy.calledOnce);

    });

    it("should move all messages from source to destination", async () => {
        receiveMessageResponses = [];
        for (let i=0; i<5; i++) {
            receiveMessageResponses.push({
                Messages: [
                    createMessage(),
                    createMessage(),
                    createMessage()
                ]
            });
        }

        const sqsMove= new SqsMoveWithAttrs(sqsClient, "from", "to");

        expect(await sqsMove.move(3)).to.equals(15);

        expect(sendMessageBatchSpy.callCount).equals(5);
        expect(sendMessagesCount).to.equals(15);
        expect(deleteMessageBatchSpy.callCount).equals(5);
        expect(deletedMessagesCount).to.equals(15);
    });

    it ("should send big messages in separate send requests", async () => {
        receiveMessageResponses = [
            {
                Messages: [
                    createBigMessage(),
                    createBigMessage()
                ]
            }];

        const sqsMove= new SqsMoveWithAttrs(sqsClient, "from", "to");
        expect (await sqsMove.move(4)).to.equals(2);
        expect(sendMessageBatchSpy.callCount).equals(2);
    });

});
