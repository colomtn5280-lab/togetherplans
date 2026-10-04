# DateMeUp transactional emails

12 send-ready HTML templates (600px, table layout, inline styles, dark-mode media query, Outlook conditionals). Merge fields use {{double_braces}}: first_name, email, token, inviter, group_name, proposer, proposal_title, proposal_id, card_id, date.

- 01-verify-email.html — subject: "Confirm your email" · preheader: "One tap and your DateMeUp account is ready."
- 02-welcome.html — subject: "Welcome. Now invite one person." · preheader: "DateMeUp needs two people. You're one."
- 03-reset-password.html — subject: "Reset your password" · preheader: "Set a new DateMeUp password. Link expires in 1 hour."
- 04-group-invite.html — subject: "{{inviter}} invited you to {{group_name}}" · preheader: "Join {{group_name}} on DateMeUp. No app needed to vote."
- 05-new-proposal.html — subject: "{{proposer}} proposed 3 things for {{proposal_title}}" · preheader: "Vote now. Tallies stay hidden until everyone's in."
- 06-status-update.html — subject: "Priya voted on Friday night" · preheader: "1 of 2 in. Your turn."
- 07-reminder-24h.html — subject: "Friday's plan needs your vote ⏰" · preheader: "24 hours to go. 3 haven't picked yet."
- 08-its-a-match.html — subject: "It's a match: Jazz at the Blue Room 💛" · preheader: "Friday's sorted. Calendar file attached."
- 09-take-2.html — subject: "No match on Friday night. Priya sent take 2" · preheader: "Two options kept, one new. Votes reset."
- 10-plan-changed.html — subject: "Change to Friday night: new time" · preheader: "Jazz at the Blue Room moved to 9 PM."
- 11-share-card-received.html — subject: "Sam made it official 💌" · preheader: "A Share Card for Friday night is waiting for you."
- 12-account-deleted.html — subject: "Your DateMeUp account is deleted" · preheader: "Everything is gone, as promised."

Rules: one message, one button. Voting emails never show tallies. Reminder is sent once at T-24h to non-voters only. After Dark proposals never send email (in-app only). Share Card image is server-rendered; replace the CDN src. Attach invite.ics on 08, 10, 11.

Branding: header = 3a mark (inline SVG, two figures) + "DateMeUp" + datemeup.app link; footer repeats name and domain. Inline SVG is stripped by Gmail: before sending, replace the header SVG cell with a hosted 68×68 PNG of the mark (https://cdn.datemeup.app/brand/mark-68.png) with alt "DateMeUp".
