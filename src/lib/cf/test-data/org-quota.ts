import { IOrganizationQuota } from '../types';

export const billableOrgQuotaName = 'billable';
export const billableOrgQuotaGUID = 'dcb680a9-b190-4838-a3d2-b84aa17517a6';

export const billableOrgQuota = (): IOrganizationQuota => JSON.parse(`{
  "metadata": {
    "guid": "${billableOrgQuotaGUID}",
    "url": "/v2/quota_definitions/${billableOrgQuotaGUID}",
    "created_at": "2016-06-08T16:41:39Z",
    "updated_at": "2016-06-08T16:41:26Z"
  },
  "entity": {
    "name": "${billableOrgQuotaName}",
    "non_basic_services_allowed": true,
    "total_services": 60,
    "total_routes": 1000,
    "total_private_domains": -1,
    "memory_limit": 20480,
    "trial_db_allowed": true,
    "instance_memory_limit": -1,
    "app_instance_limit": -1,
    "app_task_limit": -1,
    "total_service_keys": -1,
    "total_reserved_route_ports": 5
  }
}`);

export const trialOrgQuotaName = 'default';
export const trialOrgQuotaGUID = '99999999-a8c0-4c43-9c72-649df53da8cb';

export const trialOrgQuota = (): IOrganizationQuota => JSON.parse(`{
  "metadata": {
    "guid": "${trialOrgQuotaGUID}",
    "url": "/v2/quota_definitions/${trialOrgQuotaGUID}",
    "created_at": "2016-06-08T16:41:39Z",
    "updated_at": "2016-06-08T16:41:26Z"
  },
  "entity": {
    "name": "${trialOrgQuotaName}",
    "non_basic_services_allowed": false,
    "total_services": 60,
    "total_routes": 1000,
    "total_private_domains": -1,
    "memory_limit": 20480,
    "trial_db_allowed": false,
    "instance_memory_limit": -1,
    "app_instance_limit": -1,
    "app_task_limit": -1,
    "total_service_keys": -1,
    "total_reserved_route_ports": 5
  }
}`);
