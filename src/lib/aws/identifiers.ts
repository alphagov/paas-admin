import base32Encode from 'base32-encode';
import fnv from 'fnv-plus';

export function getRdsDbInstanceIdentifier(serviceInstanceGUID: string): string {
  return `rdsbroker-${serviceInstanceGUID}`;
}

export function getElasticacheReplicationGroupId(serviceInstanceGUID: string): string {
  const hashHexString = fnv.hash(serviceInstanceGUID, 64).hex();
  const hashBuffer = Buffer.from(hashHexString, 'hex');
  const hashBase32String = base32Encode(hashBuffer, 'RFC4648', {padding: false});
  return `cf-${hashBase32String.toLowerCase()}`;
}
