# Anchor

For the most part, an anchor acts just like a group node.
But more importantly they can be used to attach players to them, eg for seating or vehicles.

When creating an anchor, be sure to give it a unique ID within your app to ensure that every client has the same ID for the player to be anchored to:

```jsx
const seat = app.create('anchor', { id: 'seat' })
car.add(seat)

// later...
control.setEffect({ anchor: seat })
```

Compatible seats can share an optional `profileId`. Use the same profile ID only for seats with the same local coordinate system and furniture fit. The unique anchor ID remains instance-specific; the profile ID lets a player explicitly save and reuse their own calibration on another compatible instance.

```js
const middleSeat = app.create('anchor', {
  id: 'middle-seat',
  profileId: 'three-seat-sofa-v1:middle',
})
sofa.add(middleSeat)
```

## Properties

### `.{...Node}`

Inherits all [Node](/docs/scripting/nodes/Node.md) properties

### `.profileId`: String

Optional stable furniture-profile and seat-role identifier shared by compatible anchor instances. It is separate from the unique `anchorId` and must use the same anchor-local coordinate frame across instances. When present, the sitting-pose editor offers an explicit profile-save action; ordinary Apply remains specific to the current anchor.
