const { createBlindVersion } = require("../src/services/blindMode");

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

  beforeAll(() => {
    blindVersion = createBlindVersion(sampleCV);
  });

  test("should mask the candidate's name", () => {
    expect(blindVersion).toContain("CANDIDATE");
    expect(blindVersion).not.toContain("Jane Doe");
  });

  test("should mask email addresses", () => {
    expect(blindVersion).not.toContain("jane.doe@example.com");
    expect(blindVersion).toContain("[REMOVED]");
  });

  test("should mask local phone numbers", () => {
    expect(blindVersion).not.toContain("08012345678");
  });

  test("should mask international phone numbers", () => {
    expect(blindVersion).not.toContain("+234 801 234 5678");
  });

  test("should mask URLs", () => {
    expect(blindVersion).not.toContain(
      "https://linkedin.com/in/janedoe"
    );

    expect(blindVersion).toContain("[URL REMOVED]");
  });

  test("should mask address/contact information", () => {
    expect(blindVersion).not.toContain(
      "12 Example Street, Lagos"
    );
  });

  test("should preserve non-sensitive CV information", () => {
    expect(blindVersion).toContain(
      "Alex Ekwueme Federal University"
    );

    expect(blindVersion).toContain("Medical Intern");

    expect(blindVersion).toContain("Teaching Hospital");
  });
});

