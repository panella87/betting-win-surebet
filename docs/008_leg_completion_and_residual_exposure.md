# 008 - Leg completion and residual exposure

Paper and future gated execution are non-atomic across legs. BWS models reservation, submitted/simulated, partial, complete, rejected, expired, voided, rolled back, and reconciled states.

After every transition it recomputes worst-case terminal exposure and records the controlling scenario. Restart must reconstruct the same state from durable `surebet.*` evidence.

The current program implements simulation and private-paper state only. It does not authorize order placement. `BWS-230` owns this state machine.
