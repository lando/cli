'use strict';

exports.serviceUnhealthyWarning = service => ({
  title: `The service "${service}" failed its healthcheck`,
  detail: ['This may be ok but we recommend you run the command below to investigate:'],
  command: `lando logs -s ${service}`,
});

