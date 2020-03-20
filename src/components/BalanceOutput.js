import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import * as utils from '../utils';

class BalanceOutput extends Component {
  render() {
    if (!this.props.userInput.format) {
      return null;
    }

    return (
      <div className='output'>
        <p>
          Total Debit: {this.props.totalDebit} Total Credit: {this.props.totalCredit}
          <br />
          Balance from account {this.props.userInput.startAccount || '*'}
          {' '}
          to {this.props.userInput.endAccount || '*'}
          {' '}
          from period {utils.dateToString(this.props.userInput.startPeriod)}
          {' '}
          to {utils.dateToString(this.props.userInput.endPeriod)}
        </p>
        {this.props.userInput.format === 'CSV' ? (
          <pre>{utils.toCSV(this.props.balance)}</pre>
        ) : null}
        {this.props.userInput.format === 'HTML' ? (
          <table className="table">
            <thead>
              <tr>
                <th>ACCOUNT</th>
                <th>DESCRIPTION</th>
                <th>DEBIT</th>
                <th>CREDIT</th>
                <th>BALANCE</th>
              </tr>
            </thead>
            <tbody>
              {this.props.balance.map((entry, i) => (
                <tr key={i}>
                  <th scope="row">{entry.ACCOUNT}</th>
                  <td>{entry.DESCRIPTION}</td>
                  <td>{entry.DEBIT}</td>
                  <td>{entry.CREDIT}</td>
                  <td>{entry.BALANCE}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    );
  }
}

BalanceOutput.propTypes = {
  balance: PropTypes.arrayOf(
    PropTypes.shape({
      ACCOUNT: PropTypes.number.isRequired,
      DESCRIPTION: PropTypes.string.isRequired,
      DEBIT: PropTypes.number.isRequired,
      CREDIT: PropTypes.number.isRequired,
      BALANCE: PropTypes.number.isRequired
    })
  ).isRequired,
  totalCredit: PropTypes.number.isRequired,
  totalDebit: PropTypes.number.isRequired,
  userInput: PropTypes.shape({
    startAccount: PropTypes.number,
    endAccount: PropTypes.number,
    startPeriod: PropTypes.date,
    endPeriod: PropTypes.date,
    format: PropTypes.string
  }).isRequired
};

export default connect(state => {
  let balance = [];

  /* YOUR CODE GOES HERE */

  let accountsInRange = [];

  function sortObjByAccount(obj) {
    var sortable = obj;
    sortable.sort((a, b) => (a.ACCOUNT > b.ACCOUNT) ? 1 : -1)
    return sortable;
  }

  function clearBalance(obj) {
    let index = obj.length;
    while (index--) {
      if (obj[index].BALANCE === 0) {
        obj.splice(index, 1);
      }
    }
    return obj;
  }

  function isValidDate(date) {
    return date instanceof Date && !isNaN(date);
  }

  /*Get the Accounts in range*/
  state.accounts.forEach(account => {
    let newAccount = { 'ACCOUNT': account.ACCOUNT, 'DESCRIPTION': account.LABEL, 'DEBIT': 0, 'CREDIT': 0, 'BALANCE': 0 };

    if ((isNaN(state.userInput.startAccount) && account.ACCOUNT <= state.userInput.endAccount) ||
      (account.ACCOUNT >= state.userInput.startAccount && isNaN(state.userInput.endAccount)) ||
      (isNaN(state.userInput.startAccount) && isNaN(state.userInput.endAccount)) ||
      (account.ACCOUNT >= state.userInput.startAccount && account.ACCOUNT <= state.userInput.endAccount)) {
      accountsInRange.push(newAccount);
    }
  })

  /*Sort the Accounts Array by Description*/
  accountsInRange = sortObjByAccount(accountsInRange);

  /*Calculate Debit, Credit and Balance by Period*/
  accountsInRange.forEach((accout, i) => {
    state.journalEntries.forEach(entrie => {
      if (accout.ACCOUNT === entrie.ACCOUNT) {
        if ((entrie.PERIOD >= state.userInput.startPeriod && !isValidDate(state.userInput.endPeriod)) ||
          (!isValidDate(state.userInput.startPeriod) && !isValidDate(state.userInput.endPeriod)) ||
          (entrie.PERIOD >= state.userInput.startPeriod && entrie.PERIOD <= state.userInput.endPeriod)) {
          accountsInRange[i].DEBIT += entrie.DEBIT;
          accountsInRange[i].CREDIT += entrie.CREDIT;
          accountsInRange[i].BALANCE += entrie.DEBIT - entrie.CREDIT;
        }
      }
    })
  })

  balance = clearBalance(accountsInRange)

  const totalCredit = balance.reduce((acc, entry) => acc + entry.CREDIT, 0);
  const totalDebit = balance.reduce((acc, entry) => acc + entry.DEBIT, 0);

  return {
    balance,
    totalCredit,
    totalDebit,
    userInput: state.userInput
  };
})(BalanceOutput);