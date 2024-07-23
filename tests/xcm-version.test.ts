import { describe, expect, it } from "vitest";
import { convertLocationVersion, location } from "../src/util.ts"
import { VersionedLocation, Location } from "../src/xcmtypes.ts";

describe('asset location convert', () => {
    it('location v4->v3', () => {
        const fake_location : Location = location(2, [{Parachain: 1001},         {
            AccountId32: {
              id: '0x006ddf51db56437ce5c886ab28cd767fc85ad5cc5d4a679376a1f7e71328b501'
            }
          }]);

        const fake_location_v4 = convertLocationVersion(4, fake_location);
        console.log(fake_location_v4);
        expect(fake_location_v4).equal({V4: fake_location});

        const fake_location_v3 = convertLocationVersion(3, fake_location);
        expect(fake_location_v3).toBe({V3: fake_location});

        const fake_location_v2 = convertLocationVersion(2, fake_location);
        expect(fake_location_v2).toBe({V2: fake_location});
    })
})