import React, { ReactElement, ReactNode } from 'react'

interface ISuccessPageProperties {
  readonly heading: string
  readonly text?: string
  readonly children?: ReactNode
}

export function SuccessPage (props: ISuccessPageProperties): ReactElement {
  return (
    <div className='govuk-grid-row'>
      <div className='govuk-grid-column-two-thirds'>
        <div className='govuk-panel govuk-panel--confirmation'>
          <h1 className='govuk-panel__title'>{props.heading}</h1>
          {props.text ? <div className='govuk-panel__body'>{props.text}</div> : <></>}
        </div>
        {props.children ? <p className='govuk-body'>{props.children}</p> : <></>}
      </div>
    </div>
  )
}
