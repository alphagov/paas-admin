export const eventTypeDescriptions: { readonly [event: string]: string } = {
  'app.crash': 'Application crashed',

  'audit.app.create':           'Created application',
  'audit.app.update':           'Updated application',
  'audit.app.restage':          'Restaged application',
  'audit.app.delete-request':   'Requested deletion of application',
  'audit.app.start':            'Started application',
  'audit.app.stop':             'Stopped application',
  'audit.app.ssh-authorized':   'SSH access (authorized)',
  'audit.app.ssh-unauthorized': 'SSH access (unauthorized)',

  'audit.app.task.cancel': 'Cancelled task',
  'audit.app.task.create': 'Created task',

  'audit.app.build.create': 'Created a build',

  'audit.app.copy-bits':   'Duplicated application source code',
  'audit.app.upload-bits': 'Uploaded application source code',

  'audit.app.droplet.create':   'Created application droplet',
  'audit.app.droplet.delete':   'Deleted application droplet',
  'audit.app.droplet.download': 'Downloaded application droplet',
  'audit.app.droplet.mapped':   'Assigned application droplet to application',

  'audit.app.map-route':   'Mapped a route to this application',
  'audit.app.unmap-route': 'Unmapped route to application',

  'audit.app.package.create':   'Created application package',
  'audit.app.package.delete':   'Deleted application package',
  'audit.app.package.download': 'Downloaded application package',
  'audit.app.package.upload':   'Uploaded application package',

  'audit.app.process.crash':              'Application process crashed',
  'audit.app.process.create':             'Created application process',
  'audit.app.process.delete':             'Deleted application process',
  'audit.app.process.scale':              'Scaled application process',
  'audit.app.process.terminate_instance': 'Terminated application process',
  'audit.app.process.update':             'Updated application process',

  'audit.space.create':         'Created space',
  'audit.space.update':         'Updated space',
  'audit.space.delete-request': 'Requested deletion of space',

  'audit.service_broker.create': 'Created service broker',
  'audit.service_broker.update': 'Updated service broker',
  'audit.service_broker.delete': 'Deleted service broker',

  'audit.service.create': 'Created service',
  'audit.service.update': 'Updated service',
  'audit.service.delete': 'Deleted service',

  'audit.service_plan.create': 'Created service plan',
  'audit.service_plan.update': 'Updated service plan',
  'audit.service_plan.delete': 'Deleted service plan',

  'audit.service_instance.create': 'Created service instance',
  'audit.service_instance.update': 'Updated service instance',
  'audit.service_instance.delete': 'Deleted service instance',

  'audit.service_instance.bind_route':   'Bound route service to route',
  'audit.service_instance.unbind_route': 'Unbound route service from route',

  'audit.user_provided_service_instance.create': 'Created user provided service',
  'audit.user_provided_service_instance.update': 'Updated user provided service',
  'audit.user_provided_service_instance.delete': 'Deleted user provided service',

  'audit.service_binding.create': 'Bound service to application',
  'audit.service_binding.delete': 'Deleted binding between service and application',

  'audit.service_key.create': 'Created service key',
  'audit.service_key.delete': 'Deleted service key',

  'audit.route.create':         'Created route',
  'audit.route.update':         'Updated route',
  'audit.route.delete-request': 'Requested deletion of route',

  'audit.space.role.add':    'Added role to user',
  'audit.space.role.remove': 'Removed role from user',
};
