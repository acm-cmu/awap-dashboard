/* eslint-disable max-len */
import type { NextPage } from 'next';
import { UserLayout } from '@layout';
import {
  Form,
  InputGroup,
  Row,
  Col,
  Container,
  Card,
  Button,
} from 'react-bootstrap';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { InferGetServerSidePropsType, GetServerSideProps } from 'next';
import {
  DynamoDB,
  DynamoDBClientConfig,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import axios, { AxiosError, AxiosResponse } from 'axios';

import { DynamoDBDocument, ScanCommandInput } from '@aws-sdk/lib-dynamodb';
import { authOptions } from '@pages/api/auth/[...nextauth]';
import { unstable_getServerSession } from 'next-auth/next';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';

// id is a number
const TeamMemberField = ({ id }: { id: number }) => {
  const name = `user${id}`;
  const placeholder = `Team Member ${id}`;
  const ariaLabel = `Team Member ${id}`;

  return (
    <InputGroup className="mb-3">
      <InputGroup.Text>
        <FontAwesomeIcon icon={faUser} fixedWidth />
      </InputGroup.Text>
      <Form.Control
        name={name}
        placeholder={placeholder}
        aria-label={ariaLabel}
      />
    </InputGroup>
  );
};
const config: DynamoDBClientConfig = {
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_LOCAL as string,
    secretAccessKey: process.env.AWS_SECRET_KEY_LOCAL as string,
  },
  region: process.env.AWS_REGION_LOCAL,
};

const client = DynamoDBDocument.from(new DynamoDB(config), {
  marshallOptions: {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
});

const Profile: NextPage = ({
  team,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const router = useRouter();
  const { data: session, status } = useSession();

  const changeBracket = async (user: string | null | undefined) => {
    if (!user) return;
    const bracket = document.getElementById('bracket') as HTMLInputElement;
    const bracketValue = bracket.value;

    await axios
      .post('/api/user/bracket-change', {
        user,
        bracket: bracketValue,
      })
      .then((response: AxiosResponse) => {
        if (response.status === 200) {
          toast.success('Bracket changed successfully');
          window.location.reload();
        }
      })
      .catch((reason: AxiosError) => {
        if (reason.response?.status === 400) {
          toast.error('Bracket changing is not permitted.');
        } else {
          toast.error('Something went wrong');
        }
      });
  };

  const handleChangeBracket = async () => changeBracket(session?.user.name);

  const teamMembers = [];
  for (let i = 1; i <= 4; i += 1) {
    teamMembers.push(<TeamMemberField id={i} />);
  }

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/auth/login');
  }, [status]);

  if (status === 'authenticated') {
    return (
      <UserLayout>
        <div className="bg-light min-vh-100 d-flex flex-row dark:bg-transparent">
          <Container>
            <Row className="justify-content-center">
              <Col md={6}>
                <Card className="mb-4 rounded-0">
                  <Card.Body className="p-4">
                    <h1 className="text-center">Team Profile</h1>
                    <div className="text-center">
                      <Image
                        width={300}
                        height={300}
                        src={`/assets/avatars/avatar_${session.user.image}.jpg`}
                        alt="Team Logo"
                      />
                    </div>
                    <div>
                      Team Name: <strong>{session.user.name}</strong>
                    </div>
                    <div>
                      Team Lead Email: <strong>{session.user.email}</strong>
                    </div>
                    <div>
                      Bracket:{' '}
                      <strong>
                        {team.bracket.charAt(0).toUpperCase() +
                          team.bracket.slice(1)}
                      </strong>
                    </div>
                    <br />
                    <div>
                      <strong>Change Bracket:</strong>
                    </div>

                    <select
                      className="form-select"
                      aria-label="Default select example"
                      id="bracket"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="advanced">Advanced</option>
                    </select>
                    <br />
                    <Button onClick={handleChangeBracket} variant="dark">
                      Change Bracket
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Container>
        </div>
      </UserLayout>
    );
  }
  return <div>loading</div>;
};
export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await unstable_getServerSession(
    context.req,
    context.res,
    authOptions,
  );

  if (!session || !session.user) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    };
  }

  const params: ScanCommandInput = {
    TableName: process.env.AWS_PLAYER_TABLE_NAME,
    FilterExpression: 'team_name = :team_name',
    ExpressionAttributeValues: {
      ':team_name': { S: session.user.name },
    },
  };

  const command = new ScanCommand(params);
  const result = await client.send(command);

  const userData = result.Items;
  if (!userData) {
    return {
      props: { team: { bracket: null } }, // will be passed to the page component as props
    };
  }

  const team = {
    bracket: userData[0].bracket.S,
  };

  return {
    props: { team }, // will be passed to the page component as props
  };
};
export default Profile;
