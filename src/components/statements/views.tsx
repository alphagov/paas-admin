import moment from 'moment';
import React, { ReactElement } from 'react';

import { DATE } from '../../layouts';
import { RouteLinker } from '../app/context';

interface ITotals {
  readonly incVAT: number;
  readonly exVAT: number;
}

interface IResourceUsage {
  readonly resourceGUID: string;
  readonly resourceName: string;
  readonly resourceType: string;
  readonly orgGUID: string;
  readonly spaceGUID: string;
  readonly spaceName: string;
  readonly planGUID: string;
  readonly planName: string;
  readonly price: {
    readonly incVAT: number;
    readonly exVAT: number;
  };
}

export interface IFilterResource {
  readonly guid: string;
  readonly name: string;
}

interface IStatementProps {
  readonly isCurrentMonth: boolean;
  readonly csrf: string;
  readonly filterMonth: string;
  readonly filterSpace?: IFilterResource;
  readonly filterService?: IFilterResource;
  readonly linkTo: RouteLinker;
  readonly organizationGUID: string;
  readonly organisationName: string;
  readonly orderDirection: string;
  readonly orderBy: string;
  readonly items: ReadonlyArray<IResourceUsage>;
}

interface IStatementsPageProperties extends IStatementProps {
  readonly listOfPastYearMonths: { readonly [i: string]: string };
  readonly spaces: ReadonlyArray<any>;
  readonly plans: ReadonlyArray<any>;
  readonly currentMonth: string;
  readonly adminFee: number;
  readonly totals: ITotals;
  readonly usdCurrencyRates: ReadonlyArray<any>;
  
}

function orderDirection(value: string): string {
  return value === 'asc' ? 'asc' : 'desc';
}

function convertDateToMonthLong(dateString: string): string {
  const date = new Date(dateString)
  const month = date.toLocaleString('default', { month: 'long' });
  return month
}

export function StatementsPage(props: IStatementsPageProperties): ReactElement {
  return (
    <>
      <div className="govuk-grid-row">
        <div className="govuk-grid-column-full">
          <h1 className="govuk-heading-l">
            <span className="govuk-caption-l">
              <span className="govuk-visually-hidden">Organisation</span>{' '}
                {props.organisationName}
              </span>{' '}
              Monthly billing statement{' '}
              <span className="govuk-visually-hidden">
                for {props.currentMonth}
                {props.filterSpace?.guid !== 'none' ?
                  ` in ${props.filterSpace?.name.toLowerCase()} space`
                : ''
                }
                {props.filterService?.guid !== 'none' ?
                  ` with ${props.filterService?.name.toLowerCase()} services`
                  : ''
                }{' '}
                sorted by{' '} 
                {props.orderBy === 'amount' ? 'Inc VAT' : props.orderBy} column{' '}
                in{' '}{orderDirection(props.orderDirection) === 'asc' ? 'ascending': 'descending'}{' '}order
              </span>
          </h1>
        </div>

        <div className="govuk-grid-column-full">
          <form
            method="get"
            action={props.linkTo('admin.statement.dispatcher', {
              organizationGUID: props.organizationGUID,
            })}
            className="paas-statement-range"
          >
            <input type="hidden" name="_csrf" value={props.csrf} />
            <div className="scrollable-table-container">
              <table className="govuk-table paas-statement-filters">
              <tbody className="govuk-table__body">
                <tr className="govuk-table__row">
                  <th className="govuk-table__header" scope="column">
                    Month
                  </th>
                  <th className="govuk-table__header" scope="column">
                    Spaces
                  </th>
                  <th className="govuk-table__header" scope="column">
                    Services and apps
                  </th>
                  <th
                    className="govuk-table__header paas-hidden-table-header"
                    scope="column"
                  >
                    Filter
                  </th>
                </tr>
                <tr>
                  <td className="govuk-table__cell">
                    <label className="govuk-label govuk-visually-hidden" htmlFor="rangeStart">
                      Select month to filter by
                    </label>
                    <select
                      className="govuk-select govuk-!-width-full"
                      id="rangeStart"
                      name="rangeStart"
                    >
                      {Object.keys(props.listOfPastYearMonths).map(
                        (key, index) => (
                          <option
                            key={index}
                            value={key}
                            selected={props.filterMonth === key}
                          >
                            {props.listOfPastYearMonths[key]}
                          </option>
                        ),
                      )}
                    </select>
                  </td>
                  <td className="govuk-table__cell">
                    <label className="govuk-label govuk-visually-hidden" htmlFor="space">
                      Select a space to filter by
                    </label>
                    <select
                      className="govuk-select govuk-!-width-full"
                      id="space"
                      name="space"
                    >
                      {props.spaces.map(space => (
                        <option
                          key={space.guid}
                          value={space.guid}
                          selected={props.filterSpace?.guid === space.guid}
                        >
                          {space.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="govuk-table__cell">
                    <label className="govuk-label govuk-visually-hidden" htmlFor="service">
                      Select services and apps to filter by
                    </label>
                    <select
                      className="govuk-select govuk-!-width-full"
                      id="service"
                      name="service"
                    >
                      {props.plans.map(plan => (
                        <option
                          key={plan.guid}
                          value={plan.guid}
                          selected={props.filterService?.guid === plan.guid}
                        >
                          {plan.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="govuk-table__cell paas-statement-filter">
                    <button
                      className="govuk-button"
                      data-module="govuk-button"
                      data-prevent-double-click="true"
                    >
                      Filter <span className="govuk-visually-hidden">with selected options</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            </div>

            <input type="hidden" name="sort" value={props.orderBy} />
            <input type="hidden" name="order" value={props.orderDirection} />
          </form>
        </div>

        <div className="govuk-grid-column-full">
          <div className="scrollable-table-container">
            <table className="govuk-table paas-exchange-rate">
            <caption className="govuk-visually-hidden">
              Summary of total cost inclusive of 10% admin fee, shown with and without VAT
            </caption>
            <tr className="govuk-table__row">
              <th className="govuk-table__header" scope="row">
                Total cost for {props.currentMonth}{' '}
                {props.filterSpace?.guid !== 'none' ? (
                  <span className="paas-text-regular">
                    in <strong>{props.filterSpace?.name.toLowerCase()}</strong>{' '}
                    space
                  </span>
                ) : (
                  <></>
                )}{' '}
                {props.filterService?.guid !== 'none' ? (
                  <span className="paas-text-regular">
                    with{' '}
                    <strong>{props.filterService?.name.toLowerCase()}</strong>{' '}
                    services
                  </span>
                ) : (
                  <></>
                )}
              </th>
              <th className="paas-month-price paas-month-price-demphasised">
                £
                {(
                  props.totals.exVAT +
                  props.totals.exVAT * props.adminFee
                ).toFixed(2)}
              </th>
              <th className="paas-month-price">
                £
                {(
                  props.totals.incVAT +
                  props.totals.incVAT * props.adminFee
                ).toFixed(2)}
              </th>
            </tr>
            <tr>
              <td className="govuk-table__cell">
                <small>Included 10% admin fee:</small>
              </td>
              <td className="paas-month-price">
                <small>
                  £{(props.totals.exVAT * props.adminFee).toFixed(2)}
                </small>
              </td>
              <td className="paas-month-price">
                <small>
                  £{(props.totals.incVAT * props.adminFee).toFixed(2)}
                </small>
              </td>
            </tr>
            <tr className="paas-month-total-information">
              {props.usdCurrencyRates.length === 1 ? (
                <td className="govuk-table__cell">
                  Exchange rate: £1 to $
                  {1.0 / props.usdCurrencyRates[0].rate.toFixed(2)}
                </td>
              ) : (
                <></>
              )}
              {props.usdCurrencyRates.length > 1 ? (
                <td className="govuk-table__cell">
                  Exchange rate:{' '}
                  {props.usdCurrencyRates.map((usdCurrencyRate, index) => (
                    <span key={index}>
                      £1 to ${(1.0 / usdCurrencyRate.rate).toFixed(2)} from{' '}
                      {moment(usdCurrencyRate.validFrom).format(DATE)}
                    </span>
                  ))}
                </td>
              ) : (
                <></>
              )}
              <td className="paas-month-price">ex VAT</td>
              <td className="paas-month-price">inc VAT at 20%</td>
            </tr>
          </table>
          </div>
          <p>
            <a
              href={props.linkTo('admin.statement.download', {
                organizationGUID: props.organizationGUID,
                rangeStart: props.filterMonth,
              })}
              className="govuk-link"
              download
            >
              Download a spreadsheet of these items [CSV] <span className="govuk-visually-hidden">as a comma-separated values file</span>
            </a>
          </p>
        </div>
      </div>

      {props.items.length === 0 ? (
        <p className="paas-table-notification">
          There is no record of any usage for that period.
        </p>
      ) : (
        <Statement {...props} />
      )}
    </>
  );
}

function Statement(props: IStatementProps): ReactElement {
  return (
    <>
      {props.isCurrentMonth ? (
        <p className="paas-table-notification">
          This statement shows up to date provisional usage data for current
          month.
        </p>
      ) : (
        <></>
      )}
      <form
        method="get"
        action={props.linkTo('admin.statement.dispatcher', {
          organizationGUID: props.organizationGUID,
        })}
        className="paas-statement-range"
      >
        <input type="hidden" name="_csrf" value={props.csrf} />
        <input type="hidden" name="rangeStart" value={props.filterMonth} />
        <input type="hidden" name="space" value={props.filterSpace?.guid} />
        <input type="hidden" name="service" value={props.filterService?.guid} />

        <div className="scrollable-table-container">
          <table className="govuk-table paas-table-billing-statement" aria-readonly="true">
          <caption className="govuk-visually-hidden">
            Cost itemisation for {convertDateToMonthLong(props.filterMonth)}
            {props.filterSpace?.guid !== 'none' ? ` in ${props.filterSpace?.name.toLowerCase()} space` : ''}
            {props.filterService?.guid !== 'none' ? ` with ${props.filterService?.name.toLowerCase()} services` : ''}{' '}sorted by{' '} 
            {props.orderBy === 'amount' ? 'Inc VAT' : props.orderBy} column{' '}in{' '} 
            {orderDirection(props.orderDirection) === 'asc' ? 'ascending': 'descending'}{' '}order
          </caption>
          <thead className="govuk-table__head">
            <tr className="govuk-table__row">
              <th className="govuk-table__header" 
                scope="col"
                aria-sort={
                  props.orderBy === 'name' ?
                  orderDirection(props.orderDirection) === 'asc' ? 'ascending': 'descending'
                  : undefined
                }
              >
                {props.orderBy === 'name' ? (
                  <input
                    type="hidden"
                    name="order"
                    value={orderDirection(props.orderDirection)}
                  />
                ) : (
                  <></>
                )}
                <button
                  type="submit"
                  name="sort"
                  value="name"
                  className={`govuk-button filter-header ${
                    props.orderBy === 'name'
                      ? orderDirection(props.orderDirection)
                      : ''
                  }`}
                >
                  <span className="govuk-visually-hidden">Sort by</span>{' '}Name
                </button>
              </th>
              <th 
                className="govuk-table__header" 
                scope="col"
                aria-sort={
                  props.orderBy === 'space' ?
                  orderDirection(props.orderDirection) === 'asc' ? 'ascending': 'descending'
                  : undefined
                }
                >
                {props.orderBy === 'space' ? (
                  <input
                    type="hidden"
                    name="order"
                    value={orderDirection(props.orderDirection)}
                  />
                ) : (
                  <></>
                )}
                <button
                  type="submit"
                  name="sort"
                  value="space"
                  className={`govuk-button filter-header ${
                    props.orderBy === 'space'
                      ? orderDirection(props.orderDirection)
                      : ''
                  }`}
                >
                  <span className="govuk-visually-hidden">Sort by</span>{' '}Space
                </button>
              </th>
              <th 
                className="govuk-table__header" 
                scope="col"
                aria-sort={
                  props.orderBy === 'plan' ?
                  orderDirection(props.orderDirection) === 'asc' ? 'ascending': 'descending'
                  : undefined
                }
                >
                {props.orderBy === 'plan' ? (
                  <input
                    type="hidden"
                    name="order"
                    value={orderDirection(props.orderDirection)}
                  />
                ) : (
                  <></>
                )}
                <button
                  type="submit"
                  name="sort"
                  value="plan"
                  className={`govuk-button filter-header ${
                    props.orderBy === 'plan'
                      ? orderDirection(props.orderDirection)
                      : ''
                  }`}
                >
                  <span className="govuk-visually-hidden">Sort by</span>{' '}Plan
                </button>
              </th>
              <th className="govuk-table__header text-right" scope="col">
                Ex VAT
              </th>
              <th 
                className="govuk-table__header text-right" 
                scope="col"
                aria-sort={
                  props.orderBy === 'amount' ?
                  orderDirection(props.orderDirection) === 'asc' ? 'ascending': 'descending'
                  : undefined
                }
                >
                {props.orderBy === 'amount' ? (
                  <input
                    type="hidden"
                    name="order"
                    value={orderDirection(props.orderDirection)}
                  />
                ) : (
                  <></>
                )}
                <button
                  type="submit"
                  name="sort"
                  value="amount"
                  className={`govuk-button filter-header ${
                    props.orderBy === 'amount'
                      ? orderDirection(props.orderDirection)
                      : ''
                  }`}
                >
                  <span className="govuk-visually-hidden">Sort by</span>{' '}Inc VAT
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="govuk-table__body">
            {props.items.map((item, index) => (
              <tr key={index} className="govuk-table__row">
                <td className="govuk-table__cell ">{item.resourceName}</td>
                <td className="govuk-table__cell ">
                  {item.spaceName || item.spaceGUID}
                </td>
                <td className="govuk-table__cell ">{item.planName}</td>
                <td className="govuk-table__cell text-right">
                  £{item.price.exVAT.toFixed(2)}
                </td>
                <td className="govuk-table__cell text-right">
                  £{item.price.incVAT.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </form>
    </>
  );
}
