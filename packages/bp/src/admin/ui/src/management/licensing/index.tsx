import { Button, Callout, Tooltip, Icon, Intent } from '@blueprintjs/core'
import { confirmDialog, lang } from 'botpress/shared'
import cx from 'classnames'
import { LicenseInfo } from 'common/licensing-service'
import _ from 'lodash'
import moment from 'moment'
import React, { Fragment } from 'react'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { connect, ConnectedProps } from 'react-redux'

import api from '~/app/api'
import PageContainer from '~/app/common/PageContainer'
import { AppState } from '~/app/rootReducer'
import EditLicense from './EditLicense'
import LicensePolicies from './LicensePolicies'
import { fetchLicensing } from './reducer'
import style from './style.scss'

type Props = ConnectedProps<typeof connector>

class LicenseStatus extends React.Component<Props> {
  state = {
    waitingForReboot: false
  }
  componentDidMount() {
    this.props.fetchLicensing()
  }

  get isUnderLimits() {
    return _.get(this.props.licensing, 'status') !== 'breached'
  }

  get isLicensed() {
    return _.get(this.props.licensing, 'status') === 'licensed'
  }

  get renewDate() {
    return moment(_.get(this.props.licensing, 'license.paidUntil', new Date())).format('lll')
  }

  get serverFingerprints() {
    return this.props.licensing && this.props.licensing.fingerprints
  }

  get license(): LicenseInfo {
    return (this.props.licensing && this.props.licensing.license) || ({} as LicenseInfo)
  }

  get isWrongFingerprint() {
    if (!this.serverFingerprints || !this.license || !this.license.fingerprint) {
      return false
    }

    return this.serverFingerprints[this.license.fingerprintType] !== this.license.fingerprint
  }

  refreshKey = async () => {
    await api.getSecured().post('/admin/management/licensing/refresh')
    this.props.fetchLicensing()
  }

  rebootServer = async () => {
    try {
      await api.getSecured().post('/admin/management/rebootServer')
      this.setState({ waitingForReboot: true })

      setTimeout(() => {
        window.location.reload()
      }, 10000)
    } catch (error) {
      this.setState({ error })
    }
  }

  enableProEdition = async () => {
    try {
      if (
        await confirmDialog(lang.tr('admin.license.status.areYouSure'), {
          acceptLabel: lang.tr('enable')
        })
      ) {
        const result = await api.getSecured().post('/admin/management/licensing/config/enablePro')
        if (result.status === 200) {
          await this.rebootServer()
        }
      }
    } catch (error) {
      this.setState({ error })
    }
  }

  renderReboot() {
    return <Callout title={lang.tr('admin.license.status.waitWhileReboot')}></Callout>
  }

  renderLicenseStatus() {
    return (
      <div
        className={cx(style.licenceStatus, { [style.licensed]: this.isLicensed, [style.unlicensed]: !this.isLicensed })}
      >
        <div>
          <span className={style.badge} />
          <span className={style.status}>
            {this.isLicensed ? lang.tr('admin.license.status.licensed') : lang.tr('admin.license.status.unlicensed')}
          </span>
          <span className={style.limits}>
            {this.isUnderLimits
              ? lang.tr('admin.license.status.underLimits')
              : lang.tr('admin.license.status.limitsBreached')}
          </span>
        </div>

        <Button className={style.refresh} onClick={this.refreshKey}>
          <Icon icon="refresh"></Icon>
        </Button>
      </div>
    )
  }

  renderFingerprintStatus() {
    if (!this.serverFingerprints) {
      return null
    }

    return (
      <Fragment>
        <div className={cx(style.info, style.fingerprint)}>
          <strong className={style.label}>{lang.tr('admin.license.status.clusterFingerprint')}:</strong>
          <code>{this.serverFingerprints.cluster_url}</code>

          <Tooltip content={lang.tr('admin.license.status.copyToClipboard')}>
            <CopyToClipboard text={this.serverFingerprints.cluster_url}>
              <Button icon="clipboard" />
            </CopyToClipboard>
          </Tooltip>
        </div>

        {this.isWrongFingerprint && (
          <Callout intent={Intent.DANGER}>{lang.tr('admin.license.status.fingerprintNoMatch')}</Callout>
        )}
      </Fragment>
    )
  }

  renderProDisabled = () => {
    return (
      <PageContainer title="Server License">
        <Callout title="Enable Botpress Professional">
          <p>
            {lang.tr('admin.license.status.useOfficial', {
              officialBinary: <strong>{lang.tr('admin.license.status.officialBinary')}</strong>
            })}
          </p>
          <p>
            <u>{lang.tr('admin.license.status.method1')}</u>
            <br />
            {lang.tr('admin.license.status.enableMethod1', {
              file: <strong>data/global/botpress.config.json</strong>,
              field: <strong>pro.enabled</strong>
            })}
          </p>
          <p>
            <u>{lang.tr('admin.license.status.method2')}</u>
            <br />
            {lang.tr('admin.license.status.enabledMethod2')}
            <br />
            <br />
            <Button onClick={this.enableProEdition}>{lang.tr('admin.license.status.enabledAndReboot')}</Button>
          </p>
        </Callout>
      </PageContainer>
    )
  }

  renderUnofficialBuild = () => {
    return (
      <PageContainer title="Server License">
        <Callout title={lang.tr('admin.license.status.unofficialBuild')}>
          <p>
            {lang.tr('admin.license.status.unofficialBuildText', {
              official: <strong>{lang.tr('admin.license.status.official')}</strong>,
              pro: <strong>{lang.tr('admin.license.status.pro')}</strong>
            })}
          </p>
        </Callout>
      </PageContainer>
    )
  }

  renderBody() {
    if (this.state.waitingForReboot) {
      return this.renderReboot()
    }

    if (this.props.licensing && !this.props.licensing.isBuiltWithPro) {
      return this.renderUnofficialBuild()
    }

    if (this.props.licensing && !this.props.licensing.isPro) {
      return this.renderProDisabled()
    }

    // @TODO: Fix those typings once we are sure what they represent
    // @ts-ignore
    const nodes = Number((this.license.limits && this.license.limits.nodes) || 0)

    return (
      <PageContainer title={lang.tr('admin.sideMenu.serverLicense')} superAdmin={true}>
        <div className={style.container}>
          <div className={style.licenseStatusContainer}>
            {this.renderLicenseStatus()}
            {this.renderFingerprintStatus()}
            <EditLicense refresh={this.props.fetchLicensing} />
          </div>
          <div>
            <div className={style.info}>
              <strong className={style.label}>{lang.tr('admin.license.status.friendlyName')}:</strong>
              {this.license.label || 'N/A'}
            </div>
            <div className={style.info}>
              <strong className={style.label}>{lang.tr('admin.license.status.renewDate')}:</strong>
              {this.renewDate}
            </div>
            <div className={style.info}>
              <strong className={style.label}>{lang.tr('admin.license.status.support')}:</strong>
              {this.license.support}

              <Tooltip content={lang.tr('admin.license.status.thisIsSupport')}>
                <Icon icon="help" />
              </Tooltip>
            </div>
            <div className={style.info}>
              <strong className={style.label}>{lang.tr('admin.license.status.allowedNodes')}:</strong>
              {this.license.limits && nodes + 1}
            </div>
            <hr />
            {this.props.licensing && (
              <div>
                <h5>{lang.tr('admin.license.status.policies')}</h5>
                <LicensePolicies license={this.license} breachs={this.props.licensing.breachReasons} />
              </div>
            )}
          </div>
        </div>
      </PageContainer>
    )
  }

  render() {
    return this.renderBody()
  }
}

const mapStateToProps = (state: AppState) => ({ licensing: state.licensing.license })

const connector = connect(mapStateToProps, { fetchLicensing })

export default connector(LicenseStatus)
