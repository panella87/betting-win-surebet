# 022 - Separate account policy

```text
account_policy=separate_from_betting-win-betting
shared_bankroll_with_betting-win-betting=no
betting-win_account_coordination=not_owned_here
credential_custody=betting-win-surebet_after_bws900_only
execution_state_owner=betting-win-surebet_after_bws900_only
```

BWS does not share strategy bankroll, reservations, risk state, credentials, signers, orders, positions, or execution decisions with `betting-win-betting`. Any future execution-account design requires a separate BWS authorization package.

`@betting-win/execution-sdk` is a provider-mechanics library, not an account coordinator. It must receive downstream-injected credential/signer references and must never centralize BWS or betting-win-betting account custody in the betting-win service.
