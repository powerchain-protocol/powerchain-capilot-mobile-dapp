import { PWRC_MESSAGE_COST_BASE_UNITS } from "./constants.ts";
import { InsufficientPwrcCreditsDomainError, PwrcCreditDomainError } from "./errors.ts";
import { responseRunway } from "./amount.ts";

export type PwrcBalanceState = {
  availableBaseUnits: bigint;
  reservedBaseUnits: bigint;
  spentBaseUnits: bigint;
  fundedBaseUnits: bigint;
};

export const EMPTY_PWRC_BALANCE: PwrcBalanceState = {
  availableBaseUnits: 0n,
  reservedBaseUnits: 0n,
  spentBaseUnits: 0n,
  fundedBaseUnits: 0n,
};

export function assertPwrcBalanceInvariant(state: PwrcBalanceState): void {
  const fields = [
    state.availableBaseUnits,
    state.reservedBaseUnits,
    state.spentBaseUnits,
    state.fundedBaseUnits,
  ];
  if (fields.some((value) => value < 0n)) {
    throw new PwrcCreditDomainError(
      "PWRC_LEDGER_INVARIANT",
      "PWRC credit balances cannot be negative.",
    );
  }
  if (
    state.fundedBaseUnits !==
    state.availableBaseUnits + state.reservedBaseUnits + state.spentBaseUnits
  ) {
    throw new PwrcCreditDomainError(
      "PWRC_LEDGER_INVARIANT",
      "PWRC funded balance must equal available + reserved + spent.",
    );
  }
}

export function fundPwrc(
  state: PwrcBalanceState,
  amountBaseUnits: bigint,
): PwrcBalanceState {
  if (amountBaseUnits <= 0n) {
    throw new RangeError("PWRC funding must be positive.");
  }
  const next = {
    ...state,
    availableBaseUnits: state.availableBaseUnits + amountBaseUnits,
    fundedBaseUnits: state.fundedBaseUnits + amountBaseUnits,
  };
  assertPwrcBalanceInvariant(next);
  return next;
}

export function reserveCompletedResponse(
  state: PwrcBalanceState,
): PwrcBalanceState {
  if (state.availableBaseUnits < PWRC_MESSAGE_COST_BASE_UNITS) {
    throw new InsufficientPwrcCreditsDomainError({
      availableBaseUnits: state.availableBaseUnits,
      requiredBaseUnits: PWRC_MESSAGE_COST_BASE_UNITS,
      responseRunway: responseRunway(state.availableBaseUnits),
    });
  }
  const next = {
    ...state,
    availableBaseUnits: state.availableBaseUnits - PWRC_MESSAGE_COST_BASE_UNITS,
    reservedBaseUnits: state.reservedBaseUnits + PWRC_MESSAGE_COST_BASE_UNITS,
  };
  assertPwrcBalanceInvariant(next);
  return next;
}

export function settleCompletedResponse(
  state: PwrcBalanceState,
): PwrcBalanceState {
  if (state.reservedBaseUnits < PWRC_MESSAGE_COST_BASE_UNITS) {
    throw new PwrcCreditDomainError(
      "PWRC_LEDGER_INVARIANT",
      "Cannot settle a PWRC response without a full reservation.",
    );
  }
  const next = {
    ...state,
    reservedBaseUnits: state.reservedBaseUnits - PWRC_MESSAGE_COST_BASE_UNITS,
    spentBaseUnits: state.spentBaseUnits + PWRC_MESSAGE_COST_BASE_UNITS,
  };
  assertPwrcBalanceInvariant(next);
  return next;
}

export function releaseCompletedResponseReservation(
  state: PwrcBalanceState,
): PwrcBalanceState {
  if (state.reservedBaseUnits < PWRC_MESSAGE_COST_BASE_UNITS) {
    throw new PwrcCreditDomainError(
      "PWRC_LEDGER_INVARIANT",
      "Cannot release a PWRC response without a full reservation.",
    );
  }
  const next = {
    ...state,
    reservedBaseUnits: state.reservedBaseUnits - PWRC_MESSAGE_COST_BASE_UNITS,
    availableBaseUnits: state.availableBaseUnits + PWRC_MESSAGE_COST_BASE_UNITS,
  };
  assertPwrcBalanceInvariant(next);
  return next;
}
