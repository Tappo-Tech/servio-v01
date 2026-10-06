const { createHash, createPublicKey } = require("node:crypto");

// SHA-256 of the SERVIO certificate's SubjectPublicKeyInfo (public data).
const SERVIO_CERTIFICATE_PUBLIC_KEY_SHA256 = "c22ef539a9f78f7cd08b3703d3d0efca17a1290ac1c593a136166d45e51c7b40";

function matchesServioCertificate(privateKeyPem) {
  try {
    const normalizedKey = String(privateKeyPem || "").replace(/\\n/g, "\n");
    const publicKey = createPublicKey(normalizedKey);
    const fingerprint = createHash("sha256")
      .update(publicKey.export({ type: "spki", format: "der" }))
      .digest("hex");
    return fingerprint === SERVIO_CERTIFICATE_PUBLIC_KEY_SHA256;
  } catch {
    return false;
  }
}

module.exports = { SERVIO_CERTIFICATE_PUBLIC_KEY_SHA256, matchesServioCertificate };
