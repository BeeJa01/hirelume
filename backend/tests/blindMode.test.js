const { createBlindVersion } = require("../src/services/blindMode");

const { describe, test, before, after, beforeEach, afterEach } = require("node:test");

const assert = require("node:assert");

describe("Blind Mode", () => {
  const sampleCV = `
Jane Doe

Email: jane.doe@example.com

Phone: 08012345678

Mobile: +234 801 234 5678

LinkedIn: https://linkedin.com/in/janedoe

Address: 12 Example Street, Lagos

EDUCATION

Alex Ekwueme Federal University

EXPERIENCE

Medical Intern

Teaching Hospital
`;

  let blindVersion;

  before(() => {
    blindVersion = createBlindVersion(sampleCV);
  });

  test("should mask the candidate's name", () => {
    assert.ok(blindVersion.includes("CANDIDATE"));
    assert.ok(!blindVersion.includes("Jane Doe"));
  });

  test("should mask email addresses", () => {
    assert.ok(!blindVersion.includes("jane.doe@example.com"));
    assert.ok(blindVersion.includes("[REMOVED]"));
  });

  test("should mask local phone numbers", () => {
    assert.ok(!blindVersion.includes("08012345678"));
  });

  test("should mask international phone numbers", () => {
    assert.ok(!blindVersion.includes("+234 801 234 5678"));
  });

  test("should mask URLs", () => {
    assert.ok(!blindVersion.includes("https://linkedin.com/in/janedoe"));
    assert.ok(blindVersion.includes("[URL REMOVED]"));
  });

  test("should mask address/contact information", () => {
    assert.ok(!blindVersion.includes("12 Example Street, Lagos"));
  });

  test("should preserve non-sensitive CV information", () => {
    assert.ok(
      blindVersion.includes("Alex Ekwueme Federal University")
    );

    assert.ok(blindVersion.includes("Medical Intern"));

    assert.ok(blindVersion.includes("Teaching Hospital"));
  });
});