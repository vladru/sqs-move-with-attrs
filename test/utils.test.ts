import AwsSdk from "aws-sdk"

import sinon from 'ts-sinon';
import {expect} from "chai";

import * as Utils from "../src/utils";

const TEST_REGION = "Test-Region";

describe("utils module", () => {

    it ("getCurrentAwsRegion method should return AWS.config.region", async () => {
        const configStub = sinon.stub(AwsSdk, "config").value({
            region: TEST_REGION
        });
        expect(Utils.getCurrentAwsRegion()).to.equals(TEST_REGION);
        configStub.restore()
    })

});