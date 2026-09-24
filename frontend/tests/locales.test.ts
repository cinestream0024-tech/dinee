import { expect, it } from "vitest";
import { resources } from "../src/i18n";
it("provides every DINEE key in every supported language", () => {
  const keys = Object.keys(resources.fr.common.dinee).sort();
  for (const resource of Object.values(resources)) {
    expect(Object.keys(resource.common.dinee).sort()).toEqual(keys);
    expect(
      Object.values(resource.common.dinee).every((value) => value.length > 0),
    ).toBe(true);
  }
});
