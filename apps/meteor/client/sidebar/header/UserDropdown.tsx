import type { IUser } from '@rocket.chat/core-typings';
import { UserStatus as UserStatusEnum, ValueOf } from '@rocket.chat/core-typings';
import { Box, Margins, Option } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useLayout, useRoute, useLogout, useSetting, useAtLeastOnePermission, useTranslation } from '@rocket.chat/ui-contexts';
import { FlowRouter } from 'meteor/kadira:flow-router';
import React, { ReactElement } from 'react';

import { triggerActionButtonAction } from '../../../app/ui-message/client/ActionManager';
import { AccountBox, SideNav } from '../../../app/ui-utils/client';
import { IAccountBoxItem } from '../../../app/ui-utils/client/lib/AccountBox';
import { userStatus } from '../../../app/user-status/client';
import { callbacks } from '../../../lib/callbacks';
import MarkdownText from '../../components/MarkdownText';
import { UserStatus } from '../../components/UserStatus';
import UserAvatar from '../../components/avatar/UserAvatar';
import { useReactiveValue } from '../../hooks/useReactiveValue';
import { useUserDisplayName } from '../../hooks/useUserDisplayName';
import { imperativeModal } from '../../lib/imperativeModal';
import EditStatusModal from './EditStatusModal';

const ADMIN_PERMISSIONS = [
	'view-logs',
	'manage-emoji',
	'manage-sounds',
	'view-statistics',
	'manage-oauth-apps',
	'view-privileged-setting',
	'manage-selected-settings',
	'view-room-administration',
	'view-user-administration',
	'access-setting-permissions',
	'manage-outgoing-integrations',
	'manage-incoming-integrations',
	'manage-own-outgoing-integrations',
	'manage-own-incoming-integrations',
	'view-engagement-dashboard',
];

const isDefaultStatus = (id: string): boolean => (Object.values(UserStatusEnum) as string[]).includes(id);

const isDefaultStatusName = (_name: string, id: string): _name is UserStatusEnum => isDefaultStatus(id);

const setStatus = (status: typeof userStatus.list['']): void => {
	AccountBox.setStatus(status.statusType as unknown as number, !isDefaultStatus(status.id) ? status.name : '');
	callbacks.run('userStatusManuallySet', status);
};

const getItems = (): ReturnType<typeof AccountBox.getItems> => AccountBox.getItems();

const translateStatusName = (t: ReturnType<typeof useTranslation>, status: typeof userStatus.list['']): string => {
	if (isDefaultStatusName(status.name, status.id)) {
		return t(status.name);
	}

	return status.name;
};

type UserDropdownProps = {
	user: Pick<IUser, 'username' | 'name' | 'avatarETag' | 'status' | 'statusText'>;
	onClose: () => void;
};

const UserDropdown = ({ user, onClose }: UserDropdownProps): ReactElement => {
	const t = useTranslation();
	const accountRoute = useRoute('account');
	const adminRoute = useRoute('admin-index');
	const logout = useLogout();
	const { sidebar, isMobile } = useLayout();

	const { username, avatarETag, status, statusText } = user;

	const displayName = useUserDisplayName(user);

	const filterInvisibleStatus = !useSetting('Accounts_AllowInvisibleStatusOption')
		? (status: ValueOf<typeof userStatus['list']>): boolean => status.name !== 'invisible'
		: (): boolean => true;

	const showAdmin = useAtLeastOnePermission(ADMIN_PERMISSIONS);

	const handleCustomStatus = useMutableCallback((e) => {
		e.preventDefault();
		imperativeModal.open({
			component: EditStatusModal,
			props: { userStatus: status, userStatusText: statusText, onClose: imperativeModal.close },
		});
		onClose();
	});

	const handleMyAccount = useMutableCallback(() => {
		accountRoute.push({});
		onClose();
	});

	const handleAdmin = useMutableCallback(() => {
		adminRoute.push();
		sidebar.toggle();
		onClose();
	});

	const handleLogout = useMutableCallback(() => {
		logout();
		onClose();
	});

	const accountBoxItems = useReactiveValue(getItems);

	const appBoxItems = (): IAccountBoxItem[] => accountBoxItems.filter((item) => item.isAppButtonItem);

	return (
		<Box display='flex' flexDirection='column' w={!isMobile ? '244px' : undefined}>
			<Box display='flex' flexDirection='row'>
				<Box mie='x4' mis='x16'>
					<UserAvatar size='x36' username={username || ''} etag={avatarETag} />
				</Box>
				<Box
					mie='x8'
					mis='x4'
					display='flex'
					overflow='hidden'
					flexDirection='column'
					fontScale='p2'
					mb='neg-x4'
					flexGrow={1}
					flexShrink={1}
				>
					<Box withTruncatedText w='full' display='flex' alignItems='center' flexDirection='row'>
						<Margins inline='x4'>
							<UserStatus status={status} />
							<Box is='span' withTruncatedText display='inline-block'>
								{displayName}
							</Box>
						</Margins>
					</Box>
					<Box color='hint'>
						<MarkdownText
							withTruncatedText
							parseEmoji={true}
							content={statusText || t(status || 'offline')}
							variant='inlineWithoutBreaks'
						/>
					</Box>
				</Box>
			</Box>
			<Option.Divider />
			<Box pi='x16' fontScale='c1' textTransform='uppercase'>
				{t('Status')}
			</Box>
			{Object.values(userStatus.list)
				.filter(filterInvisibleStatus)
				.map((status, i) => {
					const name = status.localizeName ? translateStatusName(t, status) : status.name;
					const modifier = status.statusType || user.status;

					return (
						<Option
							key={i}
							onClick={(): void => {
								setStatus(status);
								onClose();
							}}
						>
							<Option.Column>
								<UserStatus status={modifier} />
							</Option.Column>
							<Option.Content>
								<MarkdownText content={name} parseEmoji={true} variant='inline' />
							</Option.Content>
						</Option>
					);
				})}
			<Option icon='emoji' label={`${t('Custom_Status')}...`} onClick={handleCustomStatus}></Option>

			{(accountBoxItems.length || showAdmin) && (
				<>
					<Option.Divider />
					{showAdmin && <Option icon={'customize'} label={t('Administration')} onClick={handleAdmin}></Option>}
					{accountBoxItems
						.filter((item) => !item.isAppButtonItem)
						.map((item, i) => {
							const action = (): void => {
								if (item.href) {
									FlowRouter.go(item.href);
									onClose();
								}
								if (item.sideNav) {
									SideNav.setFlex(item.sideNav);
									SideNav.openFlex();
									onClose();
								}
							};

							return (
								<Option
									icon={item.icon as any}
									label={t(item.name as any)}
									onClick={item.href || item.sideNav ? action : undefined}
									key={i}
								></Option>
							);
						})}
				</>
			)}

			{appBoxItems().length > 0 && (
				<>
					<Option.Divider />
					<Box pi='x16' fontScale='c1' textTransform='uppercase'>
						{t('Apps')}
					</Box>
					{appBoxItems().map((item, key) => {
						const action = (): void => {
							triggerActionButtonAction({
								rid: '',
								mid: '',
								actionId: item.actionId,
								appId: item.appId,
								payload: { context: item.context },
							});
						};
						return (
							// We use the type assertion to any in the `label` property as i18n strings that come from apps are not known in compile time
							<>
								<Option label={t(item.name as any)} key={item.actionId + key} onClick={action} />
							</>
						);
					})}
				</>
			)}

			<Option.Divider />
			<Option icon='user' label={t('My_Account')} onClick={handleMyAccount}></Option>
			<Option icon='sign-out' label={t('Logout')} onClick={handleLogout}></Option>
		</Box>
	);
};

export default UserDropdown;
