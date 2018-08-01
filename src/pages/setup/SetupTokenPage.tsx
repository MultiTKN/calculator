import { Button, Layout } from 'antd';
import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { TokensNamesList } from '../../components/lists/name/TokensNamesList';
import PageFooter from '../../components/page-footer/PageFooter';
import PageHeader from '../../components/page-header/PageHeader';
import { TokenItemEntity } from '../../entities/TokenItemEntity';
import { lazyInject, Services } from '../../Injections';
import { AnalyticsManager } from '../../manager/analytics/AnalyticsManager';
import { MultiPortfolioExecutor } from '../../manager/multitoken/MultiPortfolioExecutor';
import { PortfolioManager } from '../../manager/multitoken/PortfolioManager';
import { RebalanceResultImpl } from '../../manager/multitoken/RebalanceResultImpl';
import { TokensHelper } from '../../utils/TokensHelper';
import './SetupTokenPage.less';

interface Props extends RouteComponentProps<{}> {
}

interface State {
  availableTokenNames: TokenItemEntity[];
  selectedTokenNames: string[];
  isTokenLoading: boolean;
}

export default class SetupTokenPage extends React.Component<Props, State> {

  @lazyInject(Services.PORTFOLIOS_EXECUTOR)
  private portfolioExecutor: MultiPortfolioExecutor;
  @lazyInject(Services.PORTFOLIO_MANAGER)
  private portfolioManager: PortfolioManager;
  @lazyInject(Services.ANALYTICS_MANAGER)
  private analyticsManager: AnalyticsManager;

  constructor(props: Props) {
    super(props);

    this.analyticsManager.trackPage('/select-tokens-page');

    this.state = {
      availableTokenNames: [],
      isTokenLoading: false,
      selectedTokenNames: [],
    };
  }

  public componentDidMount(): void {
    this.portfolioManager
      .getAvailableTokens()
      .then(result => this.onSyncTokens(result))
      .catch(reason => alert(reason.message));
  }

  public render() {
    return (
      <Layout
        style={{
          minHeight: '100vh',
          minWidth: 320,
          pointerEvents: this.state.isTokenLoading ? 'none' : 'auto'
        }}
      >
        <PageHeader/>
        <header className="SetupTokenPage__header">
          Select tokens to simulate multiToken (at least two)
        </header>

        <div className="SetupTokenPage">

          <TokensNamesList
            data={this.state.availableTokenNames}
            onCheck={result => this.onCheckToken(result)}
            onChange={(name: string, checked: boolean) => this.onChangeTokens(name, checked)}
            disabled={this.state.isTokenLoading}
          />

          <Button
            type="primary"
            onClick={() => this.onNextClick()}
            disabled={!this.checkActiveNext()}
            loading={this.state.isTokenLoading}
            style={{
              marginTop: 30
            }}
          >
            Next
          </Button>
        </div>
        <PageFooter/>
      </Layout>
    );
  }

  private onSyncTokens(tokens: Map<string, string>) {
    const entities: TokenItemEntity[] = Array.from(tokens.keys())
      .map(value => new TokenItemEntity(TokensHelper.getIcon(value), value));

    this.setState({availableTokenNames: entities});
  }

  private onCheckToken(checkedValue: string[]) {
    this.setState({
      selectedTokenNames: checkedValue,
    });
  }

  private onChangeTokens(name: string, checked: boolean) {
    this.analyticsManager.trackEvent('checkbox', checked ? 'check' : 'uncheck', name);
  }

  private onNextClick() {
    this.setState({isTokenLoading: true});
    const {history} = this.props;

    this.state.selectedTokenNames.sort();

    this.analyticsManager.trackEvent('button', 'click', 'setup-to-next');

    this.portfolioManager.setupTokens(this.state.selectedTokenNames)
      .then(() => history.push('types'))
      .catch(reason => {
        console.error(reason);
        alert('something went wrong');
        this.setState({isTokenLoading: false});
      });
    this.portfolioExecutor.removeAllPortfolios();
    this.portfolioExecutor.addPortfolioManager(this.portfolioManager, new RebalanceResultImpl(this.portfolioManager));
  }

  private checkActiveNext(): boolean {
    return this.state.selectedTokenNames.length > 1;
  }

}
