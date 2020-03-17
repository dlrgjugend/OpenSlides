import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { _ } from 'app/core/translate/translation-marker';
import { ChartData, ChartDate } from 'app/shared/components/charts/charts.component';
import { AssignmentPollMethod } from 'app/shared/models/assignments/assignment-poll';
import {
    BasePoll,
    MajorityMethod,
    PercentBase,
    PollColor,
    PollType,
    VOTE_UNDOCUMENTED
} from 'app/shared/models/poll/base-poll';
import { ParsePollNumberPipe } from 'app/shared/pipes/parse-poll-number.pipe';
import { PollKeyVerbosePipe } from 'app/shared/pipes/poll-key-verbose.pipe';
import { AssignmentPollMethodVerbose } from 'app/site/assignments/models/view-assignment-poll';
import {
    MajorityMethodVerbose,
    PercentBaseVerbose,
    PollPropertyVerbose,
    PollTypeVerbose,
    ViewBasePoll
} from 'app/site/polls/models/view-base-poll';
import { ConstantsService } from '../../../core/core-services/constants.service';

const PERCENT_DECIMAL_PLACES = 3;
/**
 * The possible keys of a poll object that represent numbers.
 * TODO Should be 'key of MotionPoll|AssinmentPoll if type of key is number'
 */
export type CalculablePollKey =
    | 'votesvalid'
    | 'votesinvalid'
    | 'votescast'
    | 'yes'
    | 'no'
    | 'abstain'
    | 'votesno'
    | 'votesabstain';

/**
 * TODO: may be obsolete if the server switches to lower case only
 * (lower case variants are already in CalculablePollKey)
 */
export type PollVoteValue = 'Yes' | 'No' | 'Abstain' | 'Votes';

export const VoteValuesVerbose = {
    Y: 'Yes',
    N: 'No',
    A: 'Abstain'
};

/**
 * Interface representing possible majority calculation methods. The implementing
 * calc function should return an integer number that must be reached for the
 * option to successfully fulfill the quorum, or null if disabled
 */
export interface CalculableMajorityMethod {
    value: string;
    display_name: string;
    calc: (base: number) => number | null;
}

/**
 * Function to round up the passed value of a poll.
 *
 * @param value The calculated value of 100%-base.
 * @param addOne Flag, if the result should be increased by 1.
 *
 * @returns The necessary value to get the majority.
 */
export const calcMajority = (value: number, addOne: boolean = false) => {
    return Math.ceil(value) + (addOne ? 1 : 0);
};

/**
 * List of available majority methods, used in motion and assignment polls
 */
export const PollMajorityMethod: CalculableMajorityMethod[] = [
    {
        value: 'simple_majority',
        display_name: 'Simple majority',
        calc: base => calcMajority(base / 2, true)
    },
    {
        value: 'two-thirds_majority',
        display_name: 'Two-thirds majority',
        calc: base => calcMajority((base * 2) / 3)
    },
    {
        value: 'three-quarters_majority',
        display_name: 'Three-quarters majority',
        calc: base => calcMajority((base * 3) / 4)
    },
    {
        value: 'disabled',
        display_name: 'Disabled',
        calc: a => null
    }
];

export interface PollData {
    pollmethod: string;
    type: string;
    onehundred_percent_base: string;
    options: {
        user?: {
            short_name: string;
        };
        yes?: number;
        no?: number;
        abstain?: number;
    }[];
    votesvalid: number;
    votesinvalid: number;
    votescast: number;
}

interface OpenSlidesSettings {
    ENABLE_ELECTRONIC_VOTING: boolean;
}

/**
 * Interface describes the possible data for the result-table.
 */
export interface PollTableData {
    votingOption: string;
    votingOptionSubtitle?: string;
    class?: string;
    value: VotingResult[];
}

export interface VotingResult {
    vote?:
        | 'yes'
        | 'no'
        | 'abstain'
        | 'votesvalid'
        | 'votesinvalid'
        | 'votescast'
        | 'amount_global_no'
        | 'amount_global_abstain';
    amount?: number;
    icon?: string;
    hide?: boolean;
    showPercent?: boolean;
}

/**
 * Shared service class for polls. Used by child classes {@link MotionPollService}
 * and {@link AssignmentPollService}
 */
@Injectable({
    providedIn: 'root'
})
export abstract class PollService {
    /**
     * The default percentage base
     */
    public abstract defaultPercentBase: string;

    /**
     * The default majority method
     */
    public abstract defaultMajorityMethod: MajorityMethod;

    /**
     * Per default entitled to vote
     */
    public abstract defaultGroupIds: number[];

    /**
     * The majority method currently in use
     */
    public majorityMethod: CalculableMajorityMethod;

    public isElectronicVotingEnabled: boolean;

    /**
     * list of poll keys that are numbers and can be part of a quorum calculation
     */
    public pollValues: CalculablePollKey[] = ['yes', 'no', 'abstain', 'votesvalid', 'votesinvalid', 'votescast'];

    public constructor(
        constants: ConstantsService,
        protected translate: TranslateService,
        private pollKeyVerbose: PollKeyVerbosePipe,
        private parsePollNumber: ParsePollNumberPipe
    ) {
        constants
            .get<OpenSlidesSettings>('Settings')
            .subscribe(settings => (this.isElectronicVotingEnabled = settings.ENABLE_ELECTRONIC_VOTING));
    }

    /**
     * return the total number of votes depending on the selected percent base
     */
    public abstract getPercentBase(poll: PollData): number;

    public getVoteValueInPercent(value: number, poll: PollData): string | null {
        const totalByBase = this.getPercentBase(poll);
        if (totalByBase && totalByBase > 0) {
            const percentNumber = (value / totalByBase) * 100;
            if (percentNumber >= 0) {
                const result = percentNumber % 1 === 0 ? percentNumber : percentNumber.toFixed(PERCENT_DECIMAL_PLACES);
                return `${result} %`;
            }
        }
        return null;
    }

    /**
     * Assigns the default poll data to the object. To be extended in subclasses
     * @param poll the poll/object to fill
     */
    public getDefaultPollData(): Partial<BasePoll> {
        return {
            onehundred_percent_base: this.defaultPercentBase,
            majority_method: this.defaultMajorityMethod,
            groups_id: this.defaultGroupIds,
            type: PollType.Analog
        };
    }

    public getVerboseNameForValue(key: string, value: string): string {
        switch (key) {
            case 'majority_method':
                return MajorityMethodVerbose[value];
            case 'onehundred_percent_base':
                return PercentBaseVerbose[value];
            case 'pollmethod':
                return AssignmentPollMethodVerbose[value];
            case 'type':
                return PollTypeVerbose[value];
        }
    }

    public getVerboseNameForKey(key: string): string {
        return PollPropertyVerbose[key];
    }

    public getVoteTableKeys(poll: PollData | ViewBasePoll): VotingResult[] {
        return [
            {
                vote: 'yes',
                icon: 'thumb_up',
                showPercent: true
            },
            {
                vote: 'no',
                icon: 'thumb_down',
                showPercent: true
            },
            {
                vote: 'abstain',
                icon: 'trip_origin',
                showPercent: this.showAbstainPercent(poll)
            }
        ];
    }

    private showAbstainPercent(poll: PollData | ViewBasePoll): boolean {
        return (
            poll.onehundred_percent_base === PercentBase.YNA ||
            poll.onehundred_percent_base === PercentBase.Valid ||
            poll.onehundred_percent_base === PercentBase.Cast
        );
    }

    public showPercentOfValidOrCast(poll: PollData | ViewBasePoll): boolean {
        return poll.onehundred_percent_base === PercentBase.Valid || poll.onehundred_percent_base === PercentBase.Cast;
    }

    public getSumTableKeys(poll: PollData | ViewBasePoll): VotingResult[] {
        return [
            {
                vote: 'votesvalid',
                hide: poll.votesvalid === VOTE_UNDOCUMENTED,
                showPercent: this.showPercentOfValidOrCast(poll)
            },
            {
                vote: 'votesinvalid',
                icon: 'not_interested',
                hide: poll.votesinvalid === VOTE_UNDOCUMENTED || poll.type !== PollType.Analog,
                showPercent: poll.onehundred_percent_base === PercentBase.Cast
            },
            {
                vote: 'votescast',
                hide: poll.votescast === VOTE_UNDOCUMENTED || poll.type !== PollType.Analog,
                showPercent: poll.onehundred_percent_base === PercentBase.Cast
            }
        ];
    }

    public generateChartData(poll: PollData | ViewBasePoll): ChartData {
        const fields = this.getPollDataFields(poll);

        const data: ChartData = fields.map(key => {
            return {
                data: this.getResultFromPoll(poll, key),
                label: key.toUpperCase(),
                backgroundColor: PollColor[key],
                hoverBackgroundColor: PollColor[key]
            } as ChartDate;
        });

        return data;
    }

    private getPollDataFields(poll: PollData | ViewBasePoll): CalculablePollKey[] {
        let fields: CalculablePollKey[];
        let isAssignment: boolean;

        if (poll instanceof ViewBasePoll) {
            isAssignment = poll.pollClassType === 'assignment';
        } else {
            isAssignment = Object.keys(poll.options[0]).includes('user');
        }

        if (isAssignment) {
            if (poll.pollmethod === AssignmentPollMethod.YNA) {
                fields = ['yes', 'no', 'abstain'];
            } else if (poll.pollmethod === AssignmentPollMethod.YN) {
                fields = ['yes', 'no'];
            } else {
                fields = ['yes'];
            }
        } else {
            if (poll.onehundred_percent_base === PercentBase.YN) {
                fields = ['yes', 'no'];
            } else if (poll.onehundred_percent_base === PercentBase.Cast) {
                fields = ['yes', 'no', 'abstain', 'votesinvalid'];
            } else {
                fields = ['yes', 'no', 'abstain'];
            }
        }

        return fields;
    }

    /**
     * Extracts yes-no-abstain such as valid, invalids and totals from Poll and PollData-Objects
     */
    private getResultFromPoll(poll: PollData, key: CalculablePollKey): number[] {
        return poll[key] ? [poll[key]] : poll.options.map(option => option[key]);
    }

    public getChartLabels(poll: PollData): string[] {
        const fields = this.getPollDataFields(poll);
        return poll.options.map(option => {
            const votingResults = fields.map(field => {
                const voteValue = option[field];
                const votingKey = this.translate.instant(this.pollKeyVerbose.transform(field));
                const resultValue = this.parsePollNumber.transform(voteValue);
                const resultInPercent = this.getVoteValueInPercent(voteValue, poll);
                let resultLabel = `${votingKey}: ${resultValue}`;

                // 0 is a valid number in this case
                if (resultInPercent !== null) {
                    resultLabel += ` (${resultInPercent})`;
                }
                return resultLabel;
            });

            return `${option.user.short_name} · ${votingResults.join(' · ')}`;
        });
    }

    public isVoteDocumented(vote: number): boolean {
        return vote !== null && vote !== undefined && vote !== VOTE_UNDOCUMENTED;
    }
}
