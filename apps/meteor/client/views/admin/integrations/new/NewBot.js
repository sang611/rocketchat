import { useTranslation, useSetModal, useToastMessageDispatch, } from '@rocket.chat/ui-contexts';
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import GenericTable from '/client/components/GenericTable';
import ConfirmOwnerChangeWarningModal from '../../../../components/ConfirmOwnerChangeWarningModal';
import GenericModal from '../../../../components/GenericModal';
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
	TextAreaInput
} from '@rocket.chat/fuselage';
import VerticalBar from '../../../../components/VerticalBar';
import Page from '/client/components/Page/Page';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useEndpointData } from '/client/hooks/useEndpointData';
import { useForm } from '../../../../hooks/useForm';
import { useEndpointAction } from '/client/hooks/useEndpointAction';
import UserAvatar from '/client/components/avatar/UserAvatar';

const AddBotForm = (props) => {
	const {availableUsers, onReload, closeDraw} = props;
	const t = useTranslation();
	

	let { values, handlers, reset, hasUnsavedChanges } = useForm({urlBot: "", users: [], active: true, requestCnf: ""})

	let {urlBot, users, active, requestCnf} = values;
	let {handleUrlBot, handleUsers, handleActive, handleRequestCnf} = handlers;

	const saveAction = useEndpointAction('POST', 'integrations.bots.add', {
		urlBot,
		users,
		active,
		requestCnf,
		type: 'integrations.bots',
	}, 'User created successfully');

	const handleSave = async () => {
		await saveAction();
		onReload();
	};

	return (
		<>
			<VerticalBar.ScrollableContent>
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
								options={availableUsers}
								value={users}
								onChange={handleUsers}
								placeholder={'Select users'}
								flexShrink={1}
							/>
						</Field.Row>
					</Field>
					
					<Field>
						<Field.Label>Request config</Field.Label>
						<Field.Row>
							<TextAreaInput rows={20} flexGrow={1} value={requestCnf} onChange={handleRequestCnf} />
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
									<Button flexGrow={1} mie='x4' onClick={closeDraw}>
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




const BotTableRow = ({_id, urlBot, users, usersData, active, requestCnf, onClick }) => {

	return (
		<>
			<Table.Row tabIndex={0} role='link' action onClick={() => onClick({_id, urlBot, users, usersData, active, requestCnf})}>

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
	const UpdateBotForm = (props) => {
		const {bot, availableUsers, onReload, closeDraw} = props;
		const t = useTranslation();
		const setModal = useSetModal();
		const dispatchToastMessage = useToastMessageDispatch();
	
		let { values, handlers, reset, hasUnsavedChanges } = useForm(bot);
	
		let {urlBot, users, active, requestCnf} = values;
		let {handleUrlBot, handleUsers, handleActive, handleRequestCnf} = handlers;
	
	
		const updateAction = useEndpointAction('POST', 'integrations.bots.update', {
			_id: bot?._id,
			urlBot,
			users,
			active,
			requestCnf
		}, 'User updated successfully');
	
		const deleteAction = useEndpointAction('POST', 'integrations.bots.delete', {
			_id: bot?._id,
		}, 'User deleted successfully');
	
	
		const handleUpdate = async () => {
			await updateAction();
			onReload();
		}
	
		const handleDelete = async () => {
			await deleteAction();
			onReload();
		}
	
		const confirmOwnerChanges =
			(action, modalProps = {}) =>
			async () => {
				try {
					return await action();
				} catch (error) {
					if (error.xhr?.responseJSON?.errorType === 'user-last-owner') {
						const { shouldChangeOwner, shouldBeRemoved } = error.xhr.responseJSON.details;
						setModal(
							<ConfirmOwnerChangeWarningModal
								shouldChangeOwner={shouldChangeOwner}
								shouldBeRemoved={shouldBeRemoved}
								{...modalProps}
								onConfirm={async () => {
									await action(true);
									setModal();
								}}
								onCancel={() => {
									setModal();
									onChange();
								}}
							/>,
						);
						return;
					}
					dispatchToastMessage({ type: 'error', message: error });
				}
			};
	
		const deleteUser = confirmOwnerChanges(
			async (confirm = false) => {
				if (confirm) {
					deleteUserQuery.confirmRelinquish = confirm;
				}
	
				const result = handleDelete();
				if (result.success) {
					handleDeletedUser();
					dispatchToastMessage({ type: 'success', message: t('User_has_been_deleted') });
				} else {
					setModal();
				}
			},
			{
				contentTitle: 'Are you sure to delete?',
				confirmLabel: t('Delete'),
			},
		);
	
		const confirmDeleteUser = useCallback(() => {
			setModal(
				<GenericModal variant='danger' onConfirm={deleteUser} onCancel={() => setModal()} confirmText={t('Delete')}>
					Are you sure to delete?
				</GenericModal>,
			);
		}, [deleteUser, setModal, t]);
	
		
	
		return (
			<>
				<VerticalBar.ScrollableContent>
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
									options={availableUsers}
									value={users}
									onChange={handleUsers}
									placeholder={'Select users'}
									flexShrink={1}
								/>
							</Field.Row>
						</Field>

						<Field>
						<Field.Label>Request config</Field.Label>
						<Field.Row>
							<TextAreaInput rows={20} flexGrow={1} value={requestCnf} onChange={handleRequestCnf} />
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
									
											<Button flexGrow={1} mie='x4' onClick={confirmDeleteUser}>
												{t('Delete')}
											</Button>
											
										<Button flexGrow={1} mie='x4' onClick={closeDraw}>
											{t('Cancel')}
										</Button>
										<Button flexGrow={1} onClick={handleUpdate}>
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
	const t = useTranslation();

	const [displayDraw, setDisplayDraw] = useState(false);
	const [selectedInteg, setSelectedInteg] = useState(null);

	const handleNewButtonClick = () => {
		setSelectedInteg(null);
		setDisplayDraw(true);
	};

	const openDraw = () => {
		setDisplayDraw(true);
	}

	const closeDraw = () => {
		setDisplayDraw(false);
		setSelectedInteg(null);
	}

	const { value: userList = {} } = useEndpointData('users.list');
	const availableUsers = useMemo(() => userList?.users?.map(({_id, username, name}) => [_id, username || name]) ?? [], [userList]);
	const { value: botList, reload: reloadList } = useEndpointData('integrations.bots.list');

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
									
									w='x140'
								>
									Users
								</GenericTable.HeaderCell>

								<GenericTable.HeaderCell
									key={'urlBot'}
									
									w='x200'
								>
									Host
								</GenericTable.HeaderCell>

								<GenericTable.HeaderCell
									key={'active'}
									
									w='x50'
								>
									Active
								</GenericTable.HeaderCell>

							</>
						}
						results={botList?.integrations}
					>
						{
							 (i) =>
							<BotTableRow
							    key={i._id}
								{...i}
								onClick={(itg) => {
									setSelectedInteg(itg);
									openDraw();
								}}

							/>
							
						}
					</GenericTable>


				</Page>
				{
					displayDraw ? (
						<VerticalBar>
							<VerticalBar.Header>
								{
									selectedInteg ? "Update user" : "Add Bot"
								}
								
								<VerticalBar.Close onClick={closeDraw} />
							</VerticalBar.Header>
								{
									selectedInteg ? <UpdateBotForm bot={selectedInteg} availableUsers={availableUsers} onReload={reloadList} closeDraw={closeDraw} />
												  : <AddBotForm availableUsers={availableUsers} onReload={reloadList} closeDraw={closeDraw}/>
								}
							
						</VerticalBar>
					) : ''
				}

			</Page>
		</>
	);


}
