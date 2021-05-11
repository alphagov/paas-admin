import CloudFoundryClient from '../../lib/cf'
import { createTestContext } from '../app/app.test-helpers'

import { listServices, viewService } from './controllers'

jest.mock('../../lib/cf')

const mockService = { broker_catalog: { metadata: {} }, name: 'postgres', tags: [] }
const mockPlan = { broker_catalog: { metadata: {} }, name: 'tiny' }
const mockRichPlan = { broker_catalog: { metadata: { AdditionalMetadata: { version: '1' } } }, name: 'medium' }
const mockRichPlan2 = { broker_catalog: { metadata: { AdditionalMetadata: { version: 2 } } }, name: 'large' }

describe(listServices, () => {
  beforeEach(() => {
    // @ts-expect-error
    CloudFoundryClient.mockClear()
  })

  it('should respond with the list correctly', async () => {
    // @ts-expect-error
    CloudFoundryClient.prototype.services.mockReturnValueOnce(Promise.resolve([mockService]))

    const response = await listServices(createTestContext(), {})

    expect(response.status).toBeUndefined()
  })
})

describe(viewService, () => {
  beforeEach(() => {
    // @ts-expect-error
    CloudFoundryClient.mockClear()
  })

  it('should respond with the service details correctly', async () => {
    // @ts-expect-error
    CloudFoundryClient.prototype.v3Service.mockReturnValueOnce(Promise.resolve(mockService))
    // @ts-expect-error
    CloudFoundryClient.prototype.v3ServicePlans.mockReturnValueOnce(Promise.resolve([
      mockPlan,
      mockRichPlan,
      mockRichPlan2
    ]))

    const response = await viewService(createTestContext(), { serviceGUID: 'SERVICE_GUID' })

    expect(response.status).toBeUndefined()
    expect(response.body).toContain('Version 2')
    expect(response.body).toContain('Version 1')
    expect(response.body).not.toContain('Version undefined')
    expect(response.body).not.toContain('Version standard')
    expect(response.body).toContain('large')
    expect(response.body).not.toContain('medium')
    expect(response.body).not.toContain('tiny')
  })

  it('should respond with the service details correctly when asking for specific version', async () => {
    // @ts-expect-error
    CloudFoundryClient.prototype.v3Service.mockReturnValueOnce(Promise.resolve(mockService))
    // @ts-expect-error
    CloudFoundryClient.prototype.v3ServicePlans.mockReturnValueOnce(Promise.resolve([
      mockPlan,
      mockRichPlan,
      mockRichPlan2
    ]))

    const response = await viewService(createTestContext(), { serviceGUID: 'SERVICE_GUID', version: '1' })

    expect(response.status).toBeUndefined()
    expect(response.body).not.toContain('large')
    expect(response.body).toContain('medium')
    expect(response.body).not.toContain('tiny')
  })
})
