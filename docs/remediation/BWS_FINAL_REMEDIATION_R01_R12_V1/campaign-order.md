
# Campaign order

The order is binding and serial. Campaign order is not tranche-number order. No next source-mutating tranche starts until the prior tranche reaches an allowed terminal state and the next admission binds the predecessor postimage.

| Order | Stage | Tranche | Owner | Severity | Findings | Dependencies |
|---:|---|---|---|---|---:|---|
| 1 | S1 | `BWS-W4-T39` | R10 | P0=3, P2=1 | 4 | none |
| 2 | S1 | `BWS-W4-T37` | R10 | P1=4 | 4 | T39 |
| 3 | S1 | `BWS-W4-T38` | R10 | P0=2, P1=3 | 5 | T37, T39 |
| 4 | S1 | `BWS-W3-T26` | R07 | P0=2 | 2 | T38 |
| 5 | S1 | `BWS-W1-T01` | R03 | P0=1 | 1 | none |
| 6 | S1 | `BWS-W1-T09` | R03 | P1=2, P2=1 | 3 | T01 |
| 7 | S1 | `BWS-W3-T30` | R08 | P0=1, P1=2 | 3 | T38 |
| 8 | S1 | `BWS-W3-T31` | R08 | P0=1, P1=4, P2=1 | 6 | T01, T09, T30, T37, T38 |
| 9 | S2 | `BWS-W4-T40` | R11 | P1=2 | 2 | T39 |
| 10 | S2 | `BWS-W4-T44` | R12 | P1=4 | 4 | T40 |
| 11 | S2 | `BWS-W4-T45` | R12 | P1=3 | 3 | T44 |
| 12 | S2 | `BWS-W4-T46` | R12 | P1=3 | 3 | T44, T45 |
| 13 | S2 | `BWS-W4-T47` | R12 | P1=2, P2=1 | 3 | T44, T45, T46 |
| 14 | S3 | `BWS-W1-T02` | R01 | P1=2 | 2 | T40 |
| 15 | S3 | `BWS-W1-T03` | R01 | P1=4 | 4 | T02 |
| 16 | S3 | `BWS-W1-T04` | R01 | P1=1 | 1 | T37, T38 |
| 17 | S3 | `BWS-W1-T05` | R01 | P2=3 | 3 | T03 |
| 18 | S3 | `BWS-W1-T06` | R02 | P1=6 | 6 | T03 |
| 19 | S3 | `BWS-W1-T10` | R03 | P1=6 | 6 | T01, T03, T06, T09 |
| 20 | S3 | `BWS-W1-T11` | R03 | P1=1, P2=1 | 2 | T10, T37 |
| 21 | S3 | `BWS-W2-T21` | R06 | P1=4 | 4 | T09, T10, T40 |
| 22 | S3 | `BWS-W2-T22` | R06 | P1=4 | 4 | T21 |
| 23 | S3 | `BWS-W2-T23` | R06 | P1=5, P2=1 | 6 | T05, T11, T21 |
| 24 | S3 | `BWS-W2-T24` | R06 | P1=2 | 2 | T21, T23 |
| 25 | S3 | `BWS-W2-T25` | R06 | P2=1 | 1 | T21, T26 |
| 26 | S3 | `BWS-W3-T27` | R07 | P1=5, P2=1 | 6 | T24, T26, T40 |
| 27 | S3 | `BWS-W3-T33` | R09 | P1=4 | 4 | T27, T40 |
| 28 | S4 | `BWS-W1-T13` | R03 | P1=1, P2=1 | 2 | T03, T10, T31 |
| 29 | S4 | `BWS-W2-T14` | R04 | P1=3 | 3 | T03, T10 |
| 30 | S4 | `BWS-W1-T07` | R02 | P1=6 | 6 | T03, T06 |
| 31 | S4 | `BWS-W1-T08` | R02 | P1=2 | 2 | T06, T07 |
| 32 | S4 | `BWS-W2-T15` | R04 | P1=2 | 2 | T07, T14 |
| 33 | S4 | `BWS-W2-T16` | R04 | P1=3 | 3 | T03, T10, T14, T15 |
| 34 | S4 | `BWS-W1-T12` | R03 | P1=3 | 3 | T03, T07, T08, T10, T14, T16 |
| 35 | S4 | `BWS-W2-T17` | R04 | P1=4, P2=2 | 6 | T12, T14, T15, T16 |
| 36 | S5 | `BWS-W2-T18` | R05 | P1=2, P2=1 | 3 | T03, T26 |
| 37 | S5 | `BWS-W2-T19` | R05 | P1=5, P2=1 | 6 | T13, T18 |
| 38 | S5 | `BWS-W2-T20` | R05 | P1=3, P2=1 | 4 | T17, T18, T19 |
| 39 | S5 | `BWS-W3-T28` | R07 | P1=4, P2=1 | 5 | T18, T22, T23, T26, T27 |
| 40 | S5 | `BWS-W3-T29` | R07 | P1=5, P2=1 | 6 | T27, T28, T47 |
| 41 | S6 | `BWS-W3-T32` | R08 | P1=3 | 3 | T10, T13, T31 |
| 42 | S6 | `BWS-W3-T34` | R09 | P1=7 | 7 | T21, T23, T31, T33 |
| 43 | S6 | `BWS-W3-T35` | R09 | P1=6 | 6 | T22, T23, T25, T27, T32, T34, T47 |
| 44 | S6 | `BWS-W3-T36` | R09 | P1=4 | 4 | T27, T28, T29, T30, T31, T32, T33, T34, T35, T37 |
| 45 | S7 | `BWS-W4-T41` | R11 | P1=4 | 4 | T36, T40 |
| 46 | S7 | `BWS-W4-T42` | R11 | P1=3 | 3 | T39, T41 |
| 47 | S7 | `BWS-W4-T43` | R11 | P1=1 | 1 | T40, T41, T42, T01, T02, T03, T04, T05, T06, T07, T08, T09, T10, T11, T12, T13, T14, T15, T16, T17, T18, T19, T20, T21, T22, T23, T24, T25, T26, T27, T28, T29, T30, T31, T32, T33, T34, T35, T36, T37, T38, T39, T44, T45, T46, T47 |

`BWS-W4-T43` is last by design. It consumes closure receipts from all preceding tranches and cannot accept missing, stale, unexecuted, wrong-runtime, or wrong-generation evidence.
