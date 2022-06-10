import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo, useState } from 'react';
import GenericTable from '/client/components/GenericTable';
import {
	Box,
	Button,
	ButtonGroup,
	Field,
	FieldGroup,
	Icon,
	MultiSelectFiltered,
	TextInput,
	ToggleSwitch,
	Table,
	Divider,
} from '@rocket.chat/fuselage';
import VerticalBar from '../../../../components/VerticalBar';
import Page from '/client/components/Page/Page';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useEndpointData } from '/client/hooks/useEndpointData';
import { useForm } from '/client/hooks/useForm';
import { useEndpointAction } from '/client/hooks/useEndpointAction';
import UserAvatar from '/client/components/avatar/UserAvatar';

function AddBotForm() {
	const t = useTranslation();

	const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);
	const useQuery = ({ text, itemsPerPage, current }, sortFields) =>
		useMemo(
			() => ({
				fields: JSON.stringify({
					name: 1,
					username: 1,
					emails: 1,
					roles: 1,
					status: 1,
					avatarETag: 1,
					active: 1,
				}),
				query: JSON.stringify({
					$or: [
						{ 'emails.address': { $regex: text || '', $options: 'i' } },
						{ username: { $regex: text || '', $options: 'i' } },
						{ name: { $regex: text || '', $options: 'i' } },
					],
				}),
				sort: JSON.stringify(
					sortFields.reduce((agg, [column, direction]) => {
						agg[column] = sortDir(direction);
						return agg;
					}, {}),
				),
				...(itemsPerPage && { count: itemsPerPage }),
				...(current && { offset: current }),
			}),
			[text, itemsPerPage, current, sortFields],
		);

	const [params, setParams] = useState({ text: '', current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState([
		['name', 'asc'],
		['usernames', 'asc'],
	]);

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);
	const query = useQuery(debouncedParams, debouncedSort);
	const { value: data = {}, reload: reloadList } = useEndpointData('users.list', query);
	const availableUsers = useMemo(() => data?.users?.map(({
																													 _id,
																													 username,
																													 name,
																												 }) => [_id, username || name]) ?? [], [data]);

	const { values, handlers, reset, hasUnsavedChanges } = useForm(
		{
			users: [],
			urlBot: '',
			active: true,
		},
	);

	const { users, urlBot, active } = values;
	const { handleUsers, handleUrlBot, handleActive } = handlers;

	const saveAction = useEndpointAction('POST', 'integrations.bots.add', {
		...values,
		type: 'integrations.bots',
	}, t('User_created_successfully!'));

	const handleSave = async () => {
		await saveAction();
	};

	return (
		<>
			<VerticalBar.ScrollableContent is='form'>
				<FieldGroup>
					<Field>
						<Field.Label>Bot host</Field.Label>
						<Field.Row>
							<TextInput flexGrow={1} value={urlBot} onChange={handleUrlBot} />
						</Field.Row>
					</Field>

					<Field>
						<Field.Label>Users</Field.Label>
						<Field.Row>
							<MultiSelectFiltered
								value={users}
								options={availableUsers}
								onChange={handleUsers}
								placeholder={'Select users'}
								flexShrink={1}
							/>
						</Field.Row>
					</Field>

					<Field>
						<Field.Row>
							<Box flexGrow={1} display='flex' flexDirection='row' alignItems='center' justifyContent='space-between'>
								<Box>Active</Box>
								<ToggleSwitch
									checked={active}
									onChange={handleActive}
								/>
							</Box>
						</Field.Row>
						<br />
						<Field>
							<Field.Row>
								<Box display='flex' flexDirection='row' justifyContent='space-between' w='full'>
									<Button flexGrow={1} mie='x4'>
										{t('Cancel')}
									</Button>
									<Button flexGrow={1} onClick={handleSave}>
										{t('Save')}
									</Button>
								</Box>
							</Field.Row>
						</Field>
					</Field>
				</FieldGroup>
			</VerticalBar.ScrollableContent>
		</>
	);
}

const BotTableRow = ({ urlBot, usersData, active, onClick }) => {
	console.log({ urlBot, usersData, active });
	return (
		<>
			<Table.Row tabIndex={0} role='link' action onClick={onClick}>

				<Table.Cell>
					{
						usersData.map(({ username, avatarETag, name }) => (
							<>
								<Box display='flex' alignItems='center'>
									<UserAvatar title={username} username={username} etag={avatarETag} />
									<Box display='flex' mi='x8'>
										<Box display='flex' flexDirection='column' alignSelf='center'>
											<Box fontScale='p2m' color='default'>
												{name || username}
											</Box>
											{name && (
												<Box fontScale='p2' color='hint'>
													{' '}
													{`@${username}`}{' '}
												</Box>
											)}
										</Box>
									</Box>
								</Box>
							</>
						))
					}
				</Table.Cell>
				<Table.Cell>{urlBot}</Table.Cell>
				<Table.Cell>
					{active ? 'True' : 'False'}
				</Table.Cell>
			</Table.Row>
		</>
	);
};

export default function NewBot() {
	const t = useTranslation();

	const [displayDraw, setDisplayDraw] = useState(false);

	const onHeaderClick = () => {
		console.log('Hello');
	};

	const handleNewButtonClick = () => {
		setDisplayDraw(true);
	};

	const { value: data } = useEndpointData('integrations.bots.list');
	console.log(data);

	return (
		<>
			{/*<Box pb='x20' fontScale='h4' key='bots' dangerouslySetInnerHTML={{ __html: t('additional_integrations_Bots') }} />*/}
			<br />
			<Box>
				<ButtonGroup>
					<Button onClick={handleNewButtonClick} small>
						<Icon size='x20' name='plus' /> {t('New')}
					</Button>
				</ButtonGroup>
			</Box>
			<br />
			<Page flexDirection='row'>
				<Page>
					<GenericTable
						header={
							<>
								<GenericTable.HeaderCell
									key={'users'}
									onClick={onHeaderClick}
									w='x140'
								>
									Users
								</GenericTable.HeaderCell>

								<GenericTable.HeaderCell
									key={'urlBot'}
									onClick={onHeaderClick}
									w='x200'
								>
									Host
								</GenericTable.HeaderCell>

								<GenericTable.HeaderCell
									key={'active'}
									onClick={onHeaderClick}
									w='x50'
								>
									Active
								</GenericTable.HeaderCell>

							</>
						}
						results={data?.integrations}
					>
						{
							(i) =>
								<BotTableRow
									{...i}
									onClick={() => setDisplayDraw(true)}
								/>
						}
					</GenericTable>


				</Page>
				{
					displayDraw ? (
						<VerticalBar>
							<VerticalBar.Header>
								Add Bot
								<VerticalBar.Close onClick={() => setDisplayDraw(false)} />
							</VerticalBar.Header>

							<AddBotForm />
						</VerticalBar>
					) : ''
				}

			</Page>
		</>
	);


}
