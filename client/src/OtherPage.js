import React from 'react';

import { Link } from 'react-router-dom';

const OtherPage = () => {
  return (
    <div>
      Im some OTHER PAGE
      <Link to="/">GO BACK HOME</Link>
    </div>
  )
}

export default OtherPage;
