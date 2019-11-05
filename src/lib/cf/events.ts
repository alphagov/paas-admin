export const eventTypeDescriptions = {
  'audit.app.create':           'Created the application',
  'audit.app.update':           'Updated the application',
  'audit.app.restage':          'Restaged the application',
  'audit.app.delete-request':   'Requested deletion of the application',
  'audit.app.start':            'Started the application',
  'audit.app.stop':             'Stopped the application',
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
};
