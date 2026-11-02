import { uploadMenuItemImage } from "./menuItemImageStorage";

jest.mock("../supabase", () => ({ __esModule: true, default: {} }));

function makeStorageClient() {
  const upload = jest.fn().mockResolvedValue({ error: null });
  const getPublicUrl = jest.fn().mockReturnValue({ data: { publicUrl: "https://project.supabase.co/storage/v1/object/public/menu-item-images/test.webp" } });
  const from = jest.fn(() => ({ upload, getPublicUrl }));
  return { client: { storage: { from } }, upload, getPublicUrl, from };
}

describe("menu item image storage", () => {
  test("uploads compressed image bytes with a tenant and branch scoped object key", async () => {
    const mock = makeStorageClient();
    const url = await uploadMenuItemImage("data:image/webp;base64,YWJj", {
      tenantId: "tenant-id",
      branchId: "branch-id",
      itemId: "item-id",
    }, mock.client);

    expect(mock.from).toHaveBeenCalledWith("menu-item-images");
    expect(mock.upload).toHaveBeenCalledTimes(1);
    const [objectName, blob, options] = mock.upload.mock.calls[0];
    expect(objectName).toMatch(/^tenant-id\/branch-id\/item-id\/.+\.webp$/);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("image/webp");
    expect(options).toMatchObject({ contentType: "image/webp", upsert: false, cacheControl: "31536000" });
    expect(url).toContain("/storage/v1/object/public/menu-item-images/");
  });

  test("does not upload an existing URL again", async () => {
    const mock = makeStorageClient();
    const url = "https://cdn.example.com/existing.webp";
    await expect(uploadMenuItemImage(url, {}, mock.client)).resolves.toBe(url);
    expect(mock.upload).not.toHaveBeenCalled();
  });
});
