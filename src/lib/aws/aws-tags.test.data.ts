export function getStubResourcesByTag (): string {
  return JSON.stringify({
    ResourceTagMappingList: [
      {
        ComplianceDetails: {
          ComplianceStatus: true,
          KeysWithNoncompliantValues: [],
          NoncompliantKeys: []
        },
        ResourceARN:
          'arn:aws:cloudfront::123456789012:distribution/EDFDVBD632BHDS5',
        Tags: []
      }
    ]
  })
}
