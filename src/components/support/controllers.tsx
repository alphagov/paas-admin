import React from 'react';

import { Template } from '../../layouts';
import { IParameters, IResponse } from '../../lib/router';
import { IContext } from '../app';
import { IValidationError } from '../errors/types';

import {
  ISupportSelectionFormProperties,
  SupportSelectionPage,
} from './views';

function validateSupportSelection({ support_type }: ISupportSelectionFormProperties): ReadonlyArray<IValidationError> {
  const errors: Array<IValidationError> = [];

  if (!support_type) {
    errors.push({
      field: 'support_type',
      message: 'Select which type of support your require',
    });
  }

  return errors;
}

export async function SupportSelectionForm (ctx: IContext, _params: IParameters): Promise<IResponse> {

  const template = new Template(ctx.viewContext, 'Get support');

  return {
    body: template.render(<SupportSelectionPage
      csrf={ctx.viewContext.csrf}
      errors={[]}
      values={[]}
    />),
  };
}

export async function HandleSupportSelectionFormPost (ctx: IContext, body: ISupportSelectionFormProperties): Promise<IResponse> {
  const errors: Array<IValidationError> = [];
  const template = new Template(ctx.viewContext);

  errors.push(
    ...validateSupportSelection(body),
  );

  if (errors.length > 0) {
    template.title = 'Error: Get support';

    return {
      body: template.render(<SupportSelectionPage
        csrf={ctx.viewContext.csrf}
        errors={errors}
        values={body}
      />),
    };
  }
}

