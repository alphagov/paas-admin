import React, { ReactElement } from 'react'

interface IErrorPageParameters {
  readonly title: string
  readonly children?: string
}

export function ErrorPage (params: IErrorPageParameters): ReactElement {
  return (
    <>
      <h1 className='govuk-heading-xl'>{params.title}</h1>
      <p className='govuk-body'>
        {params.children ||
          'Something went wrong while processing the request.'}
      </p>
      <p>
        You can browse from the{' '}
        <a href='/' className='govuk-link'>
          homepage
        </a>{' '}
        to find the information you need.
      </p>
    </>
  )
}
