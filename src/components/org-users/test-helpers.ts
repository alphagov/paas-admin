export function composeOrgRoles(setup: object) {
  const defaultRoles = {
    auditors: {
      current: '0',
    },
    billing_managers: {
      current: '0',
    },
    managers: {
      current: '0',
    },
  };

  return {
    ...defaultRoles,
    ...setup,
  };
}

export function composeSpaceRoles(setup: object) {
  const defaultRoles = {
    auditors: {
      current: '0',
    },
    developers: {
      current: '0',
    },
    managers: {
      current: '0',
    },
  };

  return {
    ...defaultRoles,
    ...setup,
  };
}
