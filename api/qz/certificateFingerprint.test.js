const fs = require("node:fs");
const path = require("node:path");
const { createHash, generateKeyPairSync, X509Certificate } = require("node:crypto");
const { SERVIO_CERTIFICATE_PUBLIC_KEY_SHA256, matchesServioCertificate } = require("./certificateFingerprint");

describe("SERVIO QZ certificate fingerprint", () => {
  test("matches the bundled public certificate and installed override.crt", () => {
    const certificatePath = path.join(__dirname, "../../public/servio-qz-certificate.txt");
    const overridePath = path.join(__dirname, "../../printer-setup/override.crt");
    const certificateBytes = fs.readFileSync(certificatePath);
    const overrideBytes = fs.readFileSync(overridePath);
    const certificate = new X509Certificate(certificateBytes);
    const actualFingerprint = createHash("sha256")
      .update(certificate.publicKey.export({ type: "spki", format: "der" }))
      .digest("hex");

    expect(actualFingerprint).toBe(SERVIO_CERTIFICATE_PUBLIC_KEY_SHA256);
    expect(overrideBytes.equals(certificateBytes)).toBe(true);
  });

  test("rejects a signing key that does not match the SERVIO certificate", () => {
    const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    expect(matchesServioCertificate(privateKey.export({ type: "pkcs8", format: "pem" }))).toBe(false);
    expect(matchesServioCertificate("not a private key")).toBe(false);
  });
});
