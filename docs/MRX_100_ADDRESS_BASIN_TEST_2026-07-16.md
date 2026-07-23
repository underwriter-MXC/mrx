# MRX 100-address county and basin test

Test date: July 16, 2026

## Outcome

MRX successfully resolved 100 distinct public-facing street addresses across every state currently advertised by the website. Each accepted address produced:

- the expected state code;
- a county or parish;
- an exact-address Census result;
- an EIA or USGS basin match; and
- a geocoded point within 3 kilometers of the independently supplied public-facility point.

The runner examined 179 candidates to obtain the final 100 accepted addresses. Rejected discovery records were not counted as passes.

| State         | Accepted | Attempted | Basin examples                                  |
| ------------- | -------: | --------: | ----------------------------------------------- |
| Texas         |       10 |        12 | Permian Basin                                   |
| New Mexico    |       10 |        11 | Permian Basin                                   |
| Oklahoma      |       10 |        10 | Anadarko Basin, Cherokee Platform Basin         |
| North Dakota  |       10 |        11 | Williston Basin                                 |
| Colorado      |       10 |        12 | Denver Basin                                    |
| Wyoming       |       10 |        11 | Powder River Basin                              |
| Pennsylvania  |       10 |        12 | Appalachian Basin, Blue Ridge Thrust Belt Basin |
| West Virginia |       10 |        76 | Appalachian Basin                               |
| Ohio          |       10 |        12 | Appalachian Basin                               |
| Louisiana     |       10 |        12 | Tx-La-Ms Salt Basin                             |
| Total         |      100 |       179 | 10 advertised states                            |

West Virginia required more discovery attempts because the public-address search area crossed neighboring state borders. Fifty-three candidates were correctly rejected by the expected-state check.

## Representative accepted addresses

| State | Address                                                | County or parish  | Basin               |
| ----- | ------------------------------------------------------ | ----------------- | ------------------- |
| TX    | 200 East Wall Street, Midland, TX 79701                | Midland County    | Permian Basin       |
| NM    | 509 North Shipp Street, Hobbs, NM 88240                | Lea County        | Permian Basin       |
| OK    | 139 West Main Street, Hydro, OK 73048                  | Caddo County      | Anadarko Basin      |
| ND    | 205 East Broadway, Williston, ND 58801                 | Williams County   | Williston Basin     |
| CO    | 1121 Denver Avenue, Fort Lupton, CO 80621              | Weld County       | Denver Basin        |
| WY    | 500 South Gillette Avenue, Gillette, WY 82716          | Campbell County   | Powder River Basin  |
| PA    | 1021 Grant Street, Bulger, PA 15019                    | Washington County | Appalachian Basin   |
| WV    | 160 Washington Street, New Martinsville, WV 26155-1246 | Wetzel County     | Appalachian Basin   |
| OH    | 205 West Main Street, Deersville, OH 44693             | Harrison County   | Appalachian Basin   |
| LA    | 501 Texas Street, Shreveport, LA 71101                 | Caddo Parish      | Tx-La-Ms Salt Basin |

## Rejected candidate records

The 79 rejected discovery candidates were classified as follows:

| Reason                                                                   | Count |
| ------------------------------------------------------------------------ | ----: |
| Candidate resolved to a neighboring state                                |    53 |
| Census returned no exact address match                                   |    19 |
| Census returned an ambiguous match                                       |     4 |
| Census needed more address detail                                        |     2 |
| Census point was more than 3 kilometers from the supplied facility point |     1 |

These records demonstrate that the test runner does not accept a basin result merely because an address looks plausible.

## Defect found and corrected

The test exposed a display-normalization defect for USGS province names that already contained the words `Basin` or `Basins`. Examples could have displayed an extra trailing `Basin`. The geography normalizer now recognizes singular, plural, and parenthetical basin names without adding a repeated word.

Verified examples after the correction:

- `Williston Basin (Including Bakken)`
- `Gulf Coast Basins`

## Data sources

- U.S. Census Bureau geographies geocoder for address, county, parish, state, and coordinates
- U.S. Energy Information Administration Lower 48 Sedimentary Basins layer, June 2024 data vintage
- U.S. Geological Survey national sedimentary basin and National Oil and Gas Assessment province layers
- OpenStreetMap public-facility address points used only to assemble and distance-check non-residential test inputs

The basin remains geologic context. County or parish and state remain the legal recording jurisdiction.

## Reusable test runner

The repeatable runner is `scripts/test-basin-addresses.ts`. Example:

```sh
npx --yes tsx scripts/test-basin-addresses.ts --state=TX --count=10
```
