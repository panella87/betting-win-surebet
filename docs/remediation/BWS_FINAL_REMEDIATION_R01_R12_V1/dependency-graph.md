# Dependency graph

All edges point from prerequisite to dependent tranche. Validation found no cycles.

```text
T39 <- none
T37 <- T39
T38 <- T37, T39
T26 <- T38
T01 <- none
T09 <- T01
T30 <- T38
T31 <- T01, T09, T30, T37, T38
T40 <- T39
T44 <- T40
T45 <- T44
T46 <- T44, T45
T47 <- T44, T45, T46
T02 <- T40
T03 <- T02
T04 <- T37, T38
T05 <- T03
T06 <- T03
T10 <- T01, T03, T06, T09
T11 <- T10, T37
T21 <- T09, T10, T40
T22 <- T21
T23 <- T05, T11, T21
T24 <- T21, T23
T25 <- T21, T26
T27 <- T24, T26, T40
T33 <- T27, T40
T13 <- T03, T10, T31
T14 <- T03, T10
T07 <- T03, T06
T08 <- T06, T07
T15 <- T07, T14
T16 <- T03, T10, T14, T15
T12 <- T03, T07, T08, T10, T14, T16
T17 <- T12, T14, T15, T16
T18 <- T03, T26
T19 <- T13, T18
T20 <- T17, T18, T19
T28 <- T18, T22, T23, T26, T27
T29 <- T27, T28, T47
T32 <- T10, T13, T31
T34 <- T21, T23, T31, T33
T35 <- T22, T23, T25, T27, T32, T34, T47
T36 <- T27, T28, T29, T30, T31, T32, T33, T34, T35, T37
T41 <- T36, T40
T42 <- T39, T41
T43 <- T40, T41, T42, T01, T02, T03, T04, T05, T06, T07, T08, T09, T10, T11, T12, T13, T14, T15, T16, T17, T18, T19, T20, T21, T22, T23, T24, T25, T26, T27, T28, T29, T30, T31, T32, T33, T34, T35, T36, T37, T38, T39, T44, T45, T46, T47
```

T43 depends on every remediation tranche and remains the final closure gate.
