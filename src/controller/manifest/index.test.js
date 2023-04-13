import { afterEach, describe, expect, it, vi } from "vitest";
import { queryResponse, validManifest } from "./__mocks__/manifest.js";
import manifest from "./index.js";
import * as esQueries from "../../queries/index.js";

vi.mock("../utils.js", async () => {
  const actual = await vi.importActual("../utils.js");
  return {
    ...actual,
    checkAccountDataset: vi.fn(),
  };
});

vi.mock("../../queries/index.js", async () => {
  return {
    default: {
      query: null,
    },
  };
});

describe("Manifest", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("correctly passes requests", async () => {
    esQueries.default.query = vi.fn().mockResolvedValue(queryResponse);
    const req = {
      query: {
        account: "dini-ag-kim",
        dataset: "https://w3id.org/rhonda/polmat/scheme",
        language: "en",
      },
      params: {},
    };
    const res = {
      send: vi.fn(),
    };
    await manifest(req, res);
    expect(res.send).toBeCalledWith(validManifest);
  });

  it("not passing request", async () => {
    esQueries.default.query = vi.fn().mockResolvedValue([]);
    const req = {
      query: {
        account: "dini-ag-kim",
        dataset: "https://w3id.org/rhonda/polmat/scheme",
        language: "en",
      },
      params: {},
    };
    const res = {
      send: vi.fn(),
      status: vi.fn(),
      json: vi.fn(),
    };
    await manifest(req, res);
    expect(res.status).toBeCalledWith(404);
    expect(res.json).toBeCalledWith({
      data: [],
      message: "Sorry, nothing at this url.",
      status_code: 404,
      success: false,
    });
  });

  
});