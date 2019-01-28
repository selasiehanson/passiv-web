import { faSpinner,faLock } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import { connect } from 'react-redux';
import { Formik, FieldArray, Field, ErrorMessage } from 'formik';
import { toast } from "react-toastify";
import { baseUrl, importTarget, loadGroups } from '../actions';
import { selectCurrentGroupId, selectCurrentGroupTarget } from '../selectors';
import TargetBar from './TargetBar';
import CashBar from './CashBar';
import { Button } from '../styled/Button';
import { Table, H2, Title, Edit } from '../styled/GlobalElements';
import { patchData, postData, deleteData } from '../api';
import styled from '@emotion/styled';
import ShadowBox from '../styled/ShadowBox';

export const TargetRow = styled.div`
  margin-bottom: 10px;
  justify-content: space-between;
  > div > div {
    min-width: 20%;
    &:nth-child(2) {
      min-width: 31%;
    }
    &:last-child,
    &:nth-child(3) {
      text-align: right;
    }
  }
`;

export const TargetContainer = styled.form`
  h2 {
    margin-bottom: 20px;
  }
`;

export class AccountTargets extends React.Component {
  state = { edit: false }

  setSymbol(target, symbol) {
    target.fullSymbol = symbol;
    target.symbol = symbol.id;
    this.forceUpdate();
  }

  render() {
    const { target, groupId, startImportTarget } = this.props;
    const { edit } = this.state;

    // show a spinner if we don't have our data yet
    if (!target) {
      return (
        <ShadowBox>
          <H2>Target Portfolio</H2>
          <span><FontAwesomeIcon icon={faSpinner} spin /></span>
        </ShadowBox>
      );
    }

    // help them set a target if they don't have one yet
    if (target && target.length === 0) {
      return (
        <ShadowBox>
          <H2>Target Portfolio</H2>
          <span>No target set<Button onClick={() => startImportTarget(groupId)}>Import</Button></span>
        </ShadowBox>
      );
    }

    return (
      <ShadowBox>
        <TargetContainer>
        <H2>Target Portfolio</H2>
        <Formik
          initialValues={{ targets: target }}
          enableReinitialize
          validate={(values, actions) => {
            const errors = {};
            const cashPercentage = 100 - values.targets.reduce((total, target) => {
              if (target.percent) {
                return total + parseFloat(target.percent);
              }
              return total;
            }, 0);
            if (cashPercentage < 0) {
              errors.cash = 'Too low';
            }
            return errors;
          }}
          onSubmit={(values, actions) => {
            // set us back to non-editing state
            this.setState({edit: false});

            // create our list of api requests to make
            const apiRequests = [];
            values.targets.forEach(target => {
              if (target.id) {
                if (target.deleted) {
                  // delete this target
                  apiRequests.push(deleteData(`${baseUrl}/api/v1/portfolioGroups/${groupId}/targets/${target.id}/`));
                } else {
                // update if it's an existing target
                apiRequests.push(patchData(`${baseUrl}/api/v1/portfolioGroups/${groupId}/targets/${target.id}/`, target));
              }
            } else {
                // add if it's a new target
                apiRequests.push(postData(`${baseUrl}/api/v1/portfolioGroups/${groupId}/targets/`, target));
              }
            });

            // execute our list of api requests
            Promise.all(apiRequests)
              .then((responses) => {
                // once we're done refresh the groups
                this.props.refreshGroups();
              })
              .catch((error) => {
                // display our error
                toast.error(`Failed to edit target: ${error && error.detail}`);

                // reset the form
                actions.resetForm();
              })
          }}
          onReset={(values, actions) => {
            values.targets = target;
            this.setState({ edit: false });
          }}
          render={(props) => (
            <div>
              <TargetRow>
                <Table>
                  <Title>Symbol</Title>
                  <Title>Target</Title>
                  <Title>Actual</Title>
                  <Title>Delta</Title>
                </Table>
              </TargetRow>
                <FieldArray
                  name="targets"
                  render={arrayHelpers => {
                    const cashPercentage = 100 - props.values.targets.reduce((total, target) => {
                      if (target.percent) {
                        return total + parseFloat(target.percent);
                      }
                      return total;
                    }, 0);
                    const cashActualPercentage = 100 - props.values.targets.reduce((total, target) => {
                      if (target.actualPercentage) {
                        return total + target.actualPercentage;
                      }
                      return total;
                    }, 0);
                    return (
                    <React.Fragment>

                      {props.values.targets.filter(t => !t.deleted).map((t, index) => (
                      <TargetRow>
                        <TargetBar
                          key={t.symbol}
                          target={t}
                          edit={edit}
                          setSymbol={(symbol) => this.setSymbol(t, symbol)}
                          onDelete={(id) => {
                            const target = props.values.targets.find(t => t.id === id);
                            target.deleted = true;
                            this.forceUpdate();
                            props.setFieldTouched('targets.0.percent');
                            toast.success(`${t.fullSymbol.symbol} deleted`);
                          }}
                        >
                          <Field name={`targets.${index}.percent`} readOnly={!this.state.edit} />
                        </TargetBar>
                      </TargetRow>
                      ))}
                      <TargetRow>
                        <CashBar percentage={cashPercentage} actualPercentage={cashActualPercentage} />
                      </TargetRow>
                      <ErrorMessage name="targets" />
                      {edit ? (
                        <React.Fragment>
                          <button type="button" onClick={() => arrayHelpers.push({ symbol: null, percent: 0 })}>
                            Add
                          </button>
                          <button type="button">
                            Import
                          </button>
                          <Button type="submit" onClick={props.handleSubmit} disabled={(props.isSubmitting || !props.dirty || !props.isValid) && !props.values.targets.find(t => t.deleted)}>
                            Save
                          </Button>
                          <button type="button" onClick={props.handleReset}>
                            Cancel
                          </button>
                        </React.Fragment>
                      ) : (
                        <Edit type="button" onClick={() => this.setState({ edit: true })}><FontAwesomeIcon icon={faLock} />Edit Targets</Edit>
                        )}

                    </React.Fragment>
                  )}}
                />

              </div>
          )}
        />
        </TargetContainer>
      </ShadowBox>
    );
  }
}

const actions = {
  startImportTarget: importTarget,
  refreshGroups: loadGroups,
};

const select = state => ({
  groupId: selectCurrentGroupId(state),
  target: selectCurrentGroupTarget(state)
});

export default connect(select, actions)(AccountTargets);
