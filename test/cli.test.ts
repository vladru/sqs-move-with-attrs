import AwsSdk from "aws-sdk"

import sinon from 'ts-sinon';
import {assert, expect} from "chai";

import * as SqsMoveClass from "../src/sqs-move-with-attrs";
import * as Utils from "../src/utils";

const testSourceSqsUrl = "https://sqs.123.amazonaws.com/123/source-queue";
const testDestSqsUrl = "https://sqs.123.amazonaws.com/123/destination-queue";

const resetModuleCache = (): void => {
    // https://stackoverflow.com/questions/9210542/node-js-require-cache-possible-to-invalidate
    // https://www.npmjs.com/package/decache
    delete require.cache[require.resolve("../src/cli")];
};

const delay = async (duration = 300): Promise<void> => {
    await new Promise( (resolve) => setTimeout(resolve, duration) );
};

describe("run cli script with invalid arguments", () => {

    let sqsStub: sinon.SinonStub;
    let sqsMoveConstructorStub: sinon.SinonStub;
    let utilsStub: sinon.SinonStub;

    before( () => {
        sqsStub = sinon.stub(AwsSdk, "SQS");
        sqsMoveConstructorStub = sinon.stub(SqsMoveClass, "SqsMoveWithAttrs")
            .returns({
                move: sinon.stub().resolves(1)
            });
        utilsStub = sinon.stub(Utils, "getCurrentAwsRegion")
            .returns("us-east-1")
    });

    after( () => {
        sqsMoveConstructorStub.restore();
        sqsStub.restore();
        utilsStub.restore();
    });

    beforeEach( () => {
        resetModuleCache();
    });

    it ("should exit with -1 code if there are not enough command line arguments", async () => {
        const argvStub = sinon.stub(process,'argv').value(["1", "2", "3"]);

        await import("../src/cli");

        expect(process.exitCode).to.equals(-1);
        process.exitCode = 0;
        argvStub.restore();
    });

    it ("should exit with -1 code if source SQS url argument has invalid format", async () => {
        const argvStub = sinon.stub(process,'argv').value(["1", "2", "3:", testDestSqsUrl]);

        await import("../src/cli");

        expect(process.exitCode).to.equals(-1);
        process.exitCode = 0;
        argvStub.restore();
    });

    it ("should exit with -1 code if destination SQS url argument has invalid format", async () => {
        const argvStub = sinon.stub(process,'argv').value(["1", "2", testSourceSqsUrl, "4:"]);

        await import("../src/cli");
        await delay();

        expect(process.exitCode).to.equals(-1);
        process.exitCode = 0;
        argvStub.restore();
    })

});

describe("run cli script if AWS region not defined", () => {

    let utilsStub: sinon.SinonStub;

    before( () => {
        utilsStub = sinon.stub(Utils, "getCurrentAwsRegion")
            .returns(undefined)
    });

    after( () => {
        utilsStub.restore();
    });

    beforeEach( () => {
        resetModuleCache();
    });

    it("should exit with -1 code and display 'Missing region' error", async () => {
        const argvStub = sinon.stub(process,'argv').value(["1", "2", "sourceSqlName", testDestSqsUrl]);
        const consoleErrorSpy = sinon.spy(console, "error");

        await import("../src/cli");
        await delay();

        assert(consoleErrorSpy.withArgs("Missing region in config.").calledOnce);
        expect(process.exitCode).to.equals(-1);

        process.exitCode = 0;
        consoleErrorSpy.restore();
        argvStub.restore();
    });

});

describe("run cli script if AWS service unavailable", () => {

    let utilsStub: sinon.SinonStub;
    let sqsStub: sinon.SinonStub;

    before( () => {
        utilsStub = sinon.stub(Utils, "getCurrentAwsRegion").returns("us-east-1");
        sqsStub = sinon.stub(AwsSdk, "SQS").callsFake(() => {
            throw new Error("SQS service unavailable in test.")
        })
    });

    after( () => {
        utilsStub.restore();
        sqsStub.restore();
    });

    beforeEach( () => {
        resetModuleCache();
    });

    it("should exit with -1 code and display error", async () => {
        const argvStub = sinon.stub(process,'argv').value(["1", "2", testSourceSqsUrl, testDestSqsUrl]);
        const consoleErrorSpy = sinon.spy(console, "error");

        await import("../src/cli");
        await delay();

        assert(consoleErrorSpy.calledOnce);
        expect(process.exitCode).to.equals(-1);

        process.exitCode = 0;
        consoleErrorSpy.restore();
        argvStub.restore();
    });

});


describe("run cli script with valid arguments", () => {

    let utilsStub: sinon.SinonStub;
    let sqsStub: sinon.SinonStub;
    let sqsMoveConstructorStub: sinon.SinonStub;
    let stsStub: sinon.SinonStub;
    let testAccountId: string | undefined;

    const moveStub = sinon.stub().resolves(1);
    const onStub = sinon.stub();

    before( () => {
        utilsStub = sinon.stub(Utils, "getCurrentAwsRegion").returns("us-east-1");
        sqsStub = sinon.stub(AwsSdk, "SQS");
        sqsMoveConstructorStub = sinon.stub(SqsMoveClass, "SqsMoveWithAttrs")
            .returns({
                move: moveStub,
                on: onStub
            });
        stsStub = sinon.stub(AwsSdk, "STS")
            .returns({
                getCallerIdentity: () => {
                    return {
                        promise: (): Promise<Record<string, string | undefined>> => Promise.resolve({
                            Account: testAccountId
                        })
                    }
                }
            });
    });

    after( () => {
        utilsStub.restore();
        sqsMoveConstructorStub.restore();
        sqsStub.restore();
        stsStub.restore();
    });

    beforeEach( () => {
        resetModuleCache();
        sqsMoveConstructorStub.resetHistory();
        moveStub.resetHistory();
        onStub.resetHistory();
        testAccountId = "TestAccountId"
    });

    it("should create class instance and invoke move method", async () => {
        const argvStub = sinon.stub(process,'argv').value(["1", "2", testSourceSqsUrl, testDestSqsUrl]);

        await import("../src/cli");
        await delay();

        assert(sqsMoveConstructorStub.calledOnce);
        assert(sqsMoveConstructorStub.calledWithNew());
        expect(sqsMoveConstructorStub.args[0][1]).to.equals(testSourceSqsUrl);
        expect(sqsMoveConstructorStub.args[0][2]).to.equals(testDestSqsUrl);
        assert(moveStub.calledOnce);

        argvStub.restore();
    });

    it ("should resolve SQS names to URLs", async () => {
        const argvStub = sinon.stub(process,'argv').value(["1", "2", "source", "destination"]);
        const expectedSourceUrl = `https://sqs.us-east-1.amazonaws.com/${testAccountId}/source`;
        const expectedDestUrl = `https://sqs.us-east-1.amazonaws.com/${testAccountId}/destination`;

        await import("../src/cli");
        await delay();

        assert(sqsMoveConstructorStub.calledOnce);
        assert(sqsMoveConstructorStub.calledWithNew());
        expect(sqsMoveConstructorStub.args[0][1]).to.equals(expectedSourceUrl);
        expect(sqsMoveConstructorStub.args[0][2]).to.equals(expectedDestUrl);
        assert(moveStub.calledOnce);

        argvStub.restore();
    });

    it ("should fail if SQS name can't be resolved", async () => {
        const argvStub = sinon.stub(process,'argv').value(["1", "2", "source", "destination"]);
        testAccountId = undefined;

        await import("../src/cli");
        await delay();

        expect(process.exitCode).to.equals(-1);
        assert(sqsMoveConstructorStub.notCalled);

        process.exitCode = 0;
        argvStub.restore();
    });

    it ("should handle 'progress' event", async () => {
        const argvStub = sinon.stub(process, 'argv').value(["1", "2", "source", "destination"]);
        const stdOutWriteSpy = sinon.spy(process.stdout, 'write');

        await import("../src/cli");
        await delay();

        assert(onStub.calledOnce);
        const eventName: string = onStub.args[0][0];
        expect(eventName).to.equals("progress");

        const onFunc: Function = onStub.args[0][1];
        expect(onFunc(5,5)).to.undefined;
        expect(stdOutWriteSpy.lastCall.lastArg).to.equals("\rMessages received 5, moved 5");

        stdOutWriteSpy.restore();
        argvStub.restore();
    })

});
