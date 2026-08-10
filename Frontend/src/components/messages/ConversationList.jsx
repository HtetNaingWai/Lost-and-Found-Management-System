import Icon from '../Icon'
import ConversationItem from './ConversationItem'

function ConversationList({
  conversations,
  totalConversations,
  searchValue,
  onSearchChange,
  activeParticipantId,
  activeConversationId,
  onlineUserIds,
  onOpenConversation,
  onDeleteConversation,
}) {
  const onlineIdSet = new Set(onlineUserIds.map((id) => Number(id)))

  return (
    <section className="messages-conversation-panel">
      <div className="messages-panel-heading">
        <div>
          <h2>Messages</h2>
          <p>
            {searchValue
              ? `${conversations.length} of ${totalConversations} conversations`
              : `${totalConversations} recent ${totalConversations === 1 ? 'conversation' : 'conversations'}`}
          </p>
        </div>
      </div>

      <label className="messages-search-box">
        <Icon name="search" />
        <input
          type="search"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search conversations..."
        />
        {searchValue ? (
          <button type="button" className="messages-search-clear" onClick={() => onSearchChange('')}>
            <Icon name="close" />
          </button>
        ) : null}
      </label>

      <div className="messages-conversation-list">
        {conversations.length > 0 ? (
          conversations.map((conversation) => (
            <ConversationItem
              key={conversation.id ?? conversation.participant?.id}
              conversation={conversation}
              isActive={
                activeConversationId
                  ? activeConversationId === conversation.id
                  : activeParticipantId === conversation.participant?.id
              }
              isOnline={onlineIdSet.has(Number(conversation.participant?.id))}
              onClick={() => onOpenConversation(conversation.participant, conversation.related_item ?? null, conversation)}
              onDelete={() => onDeleteConversation?.(conversation)}
            />
          ))
        ) : (
          <div className="messages-empty-card">
            <strong>No conversations found</strong>
            <span>{searchValue ? 'Try another name or message keyword.' : 'Messages from item owners and claimants will appear here.'}</span>
          </div>
        )}
      </div>
    </section>
  )
}

export default ConversationList
