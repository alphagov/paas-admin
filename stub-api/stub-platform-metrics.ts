import express from 'express'

import { IStubServerPorts } from './index'

function mockPlatformMetrics (
  app: express.Application,
  _config: IStubServerPorts
): express.Application {
  app.get('/metrics.json', (_req, res) => {
    const aYearAgo = new Date(new Date().setFullYear(new Date().getFullYear() - 1))

    const randomValue = (min: number, max: number) => {
      return Math.random() * (max - min) + min
    }

    const generateData = (startValue: number, endValue: number) => {
      const arrayOfData = []
      for (let i = 0; i < 52; i++) {
        arrayOfData.push({ date: new Date(aYearAgo).setDate(aYearAgo.getDate() + (i * 7)), value: Math.floor(randomValue(startValue, endValue)) })
      }

      return arrayOfData
    }
    const response = {
      applications: [
        {
          metrics: generateData(1000, 2000)
        }
      ],
      services: [
        {
          metrics: generateData(100, 800)
        }
      ],
      organizations: [
        {
          metrics: generateData(50, 100)
        },
        {
          metrics: generateData(10, 30)
        }
      ],
      uptime: randomValue(99, 100).toFixed(2)
    }
    res.send(JSON.stringify(response))
  }
  )

  return app
}

export default mockPlatformMetrics
