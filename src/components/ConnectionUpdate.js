import React from 'react';
import { connect } from 'react-redux';
import AuthorizationPicker from '../components/AuthorizationPicker';

import { H3 } from '../styled/GlobalElements';
import styled from '@emotion/styled';


export const Order = styled.div`
  text-align: center;
  select {
    background: #fff;
    padding: 10px;
    margin: 12px 0;
  }
`;

class ConnectionUpdate extends React.Component{
  state = {
    allowSelectType: this.props.type === undefined ? true : false,
    defaultType: this.props.type === undefined ? this.props.authorization.type : this.props.type,
  }

  render() {
    const { authorization } = this.props
    return(
      <Order>
        {!(this.props.hideTitle) && (<H3>Update/Refresh Connection</H3>)}

        <AuthorizationPicker
          allowSelectBrokerage={false}
          brokerage={authorization.brokerage.id}
          updateBrokerageAuthorizationId={authorization.id}
          allowSelectType={this.state.allowSelectType}
          type={this.state.defaultType}
        />
      </Order>
    )
  }
}

const select = state => ({});

const actions = {};

export default connect(select, actions)(ConnectionUpdate)