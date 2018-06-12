import AbstractChart, { AbstractProperties, AbstractState } from './AbstractChart';
import { Arbitration } from '../../repository/models/Arbitration';
import DateTimeFormatOptions = Intl.DateTimeFormatOptions;
import Config from '../../Config';

interface Properties extends AbstractProperties<Array<Arbitration>> {
}

const DATE_FORMAT: DateTimeFormatOptions = {
    year: '2-digit',
    month: 'short',
    day: '2-digit',
    hour: '2-digit'
};

export class TokensCapChart extends AbstractChart<Properties, AbstractState, Array<Arbitration>, any> {

    public parseData(data: Array<Arbitration>): Array<any> {
        return data.map(value => {
            const dataResult: any = {};
            dataResult.date = new Date(value.timestamp).toLocaleDateString(['en-US'], DATE_FORMAT);

            value.arbiterTokensCap.forEach((value2, key) => {
                dataResult['arbiter' + key] = value2 * Config.getBtcUsdPrice();
            });
            value.originTokensCap.forEach((value2, key) => {
                dataResult['origin' + key] = value2 * Config.getBtcUsdPrice();
            });

            return dataResult;
        });
    }

    public getNames(): Array<string> {
        if (this.props.data.length > 0 && this.props.data[0].originTokensCap.size > 0) {
            const result: Set<string> = new Set();

            this.props.data[0].arbiterTokensCap.forEach((value2, key) => {
                result.add('arbiter' + key);
            });
            this.props.data[0].originTokensCap.forEach((value2, key) => {
                result.add('origin' + key);
            });

            return Array.from(result);
        }
        return [];
    }

}
