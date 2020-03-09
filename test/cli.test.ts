import AwsSdk from "aws-sdk"

import sinon from 'ts-sinon';
import {assert, expect} from "chai";

import * as SqsMoveClass from "../src/sqs-move-with-attrs";

const testSourceSqsUrl = "https://sqs.123.amazonaws.com/123/source-queue";
const testDestSqsUrl = "https://sqs.123.amazonaws.com/123/destination-queue";

const resetModuleCache = (): void => {
    // https://stackoverflow.com/questions/9210542/node-js-require-cache-possible-to-invalidate
    // https://www.npmjs.com/package/decache
    delete require.cache[require.resolve("../src/cli")];

};

describe("run cli script with invalid arguments", () => {

    let sqsStub: sinon.SinonStub;
    let processExitStub: sinon.SinonStub;
    let sqsMoveConstructorStub: sinon.SinonStub;

    before( () => {
        sqsStub = sinon.stub(AwsSdk, "SQS");
        processExitStub = sinon.stub(process, 'exit');
        sqsMoveConstructorStub = sinon.stub(SqsMoveClass, "SqsMoveWithAttrs")
            .returns({
                move: sinon.stub().resolves()
            });
    });

    after( () => {
        sqsMoveConstructorStub.restore();
        processExitStub.restore();
        sqsStub.restore();
    });

    beforeEach( () => {
        resetModuleCache();
    });

    it ("should exit with -1 code if there are not enough command line arguments", async () => {
        const argvStub = sinon.stub(process,'argv').value(["1", "2", "3"]);

        await import("../src/cli");

        assert(processExitStub.calledWith(-1));
        argvStub.restore();
    });

    it ("should exit with -1 code if source SQS url argument has invalid format", async () => {
        const argvStub = sinon.stub(process,'argv').value(["1", "2", "3", testDestSqsUrl]);

        await import("../src/cli");

        assert(processExitStub.calledWith(-1));
        argvStub.restore();
    });

    it ("should exit with -1 code if desination SQS url argument has invalid format", async () => {
        const argvStub = sinon.stub(process,'argv').value(["1", "2", testSourceSqsUrl, "4"]);

        await import("../src/cli");

        assert(processExitStub.calledWith(-1));
        argvStub.restore();
    })

});

describe("run cli script with missed AWS_REGION", () => {

    beforeEach( () => {
        resetModuleCache();
    });

    it("should exit with -1 code and display 'Missing region' error", async () => {
        const envStub = sinon.stub(process, 'env').returns({});
        const argvStub = sinon.stub(process,'argv').value(["1", "2", testSourceSqsUrl, testDestSqsUrl]);
        const consoleErrorSpy = sinon.spy(console, "error");

        await import("../src/cli");
        // short pause is required to fulfill console.error call
        await new Promise( (resolve) => {
           setTimeout(resolve, 300);
        });

        assert(consoleErrorSpy.withArgs("Missing region in config").calledOnce);
        expect(process.exitCode).equals(-1);

        process.exitCode = 0;
        consoleErrorSpy.restore();
        envStub.restore();
        argvStub.restore();
    });

});

describe("run cli script with valid arguments", () => {

    let sqsStub: sinon.SinonStub;
    let sqsMoveConstructorStub: sinon.SinonStub;
    const moveStub = sinon.stub().resolves();

    before( () => {
        sqsStub = sinon.stub(AwsSdk, "SQS");
        sqsMoveConstructorStub = sinon.stub(SqsMoveClass, "SqsMoveWithAttrs")
            .returns({
                move: moveStub
            });
    });

    after( () => {
        sqsMoveConstructorStub.restore();
        sqsStub.restore();
    });

    beforeEach( () => {
        resetModuleCache();
    });

    it("should create class instance and invoke move method", async () => {
        const envStub = sinon.stub(process, 'env').returns({"AWS_REGION": "us-east-1"});
        const argvStub = sinon.stub(process,'argv').value(["1", "2", testSourceSqsUrl, testDestSqsUrl]);

        await import("../src/cli");

        assert(sqsMoveConstructorStub.calledOnce);
        assert(sqsMoveConstructorStub.calledWithNew());
        expect(sqsMoveConstructorStub.args[0][1]).to.equals(testSourceSqsUrl);
        expect(sqsMoveConstructorStub.args[0][2]).to.equals(testDestSqsUrl);
        assert(moveStub.calledOnce);

        envStub.restore();
        argvStub.restore();
    })

});
