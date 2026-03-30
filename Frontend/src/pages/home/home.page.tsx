import React from 'react';
import Layout from './../../components/layout/layout';

const Homepage: React.FC = () => {
  return (
    <Layout>
      {/* Everything inside these Layout tags becomes the "children" */}
      <section>
        <h1>My First Homepage</h1>
        <p>This is where the magic happens.</p>
      </section>
    </Layout>
  );
};

export default Homepage;
